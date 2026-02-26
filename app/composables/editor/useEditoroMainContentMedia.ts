import { onBeforeUnmount, ref, watch } from 'vue'

type EditorLike = {
  view?: {
    dom: HTMLElement
    posAtCoords?: (coords: { left: number, top: number }) => { pos: number } | null
  }
  chain: () => {
    focus: () => {
      setTextSelection?: (position: number) => {
        setImage?: (payload: { src: string, alt?: string }) => {
          run: () => boolean
        }
        insertContent?: (content: string) => {
          run: () => boolean
        }
      }
      setImage?: (payload: { src: string, alt?: string }) => {
        run: () => boolean
      }
      insertContent?: (content: string | object) => {
        run: () => boolean
      }
    }
  }
}

type EditorHandlerLike = {
  canExecute: (editor: EditorLike) => boolean
  execute: (editor: EditorLike) => boolean
  isActive: (editor: EditorLike) => boolean
  isDisabled?: (editor: EditorLike) => boolean
}

type EditoroMainContentMediaOptions = {
  canUploadImage: () => boolean
  uploadImage: (file: File) => Promise<string | null>
  uploadFile: (file: File) => Promise<string | null>
}

/**
 * Encapsulates media/file upload interactions for editor toolbar, DnD and paste flows.
 * Also handles Ctrl/Cmd+Click on links inside editor content.
 * Used by `app/components/editoro/MainContent.vue`.
 */
export function useEditoroMainContentMedia(options: EditoroMainContentMediaOptions) {
  const imageInputRef = ref<HTMLInputElement>()
  const fileInputRef = ref<HTMLInputElement>()
  const pendingEditor = ref<EditorLike>()
  const pendingFileEditor = ref<EditorLike>()
  const currentEditor = ref<EditorLike>()

  let detachEditorListeners: (() => void) | null = null

  const editorHandlers: Record<string, EditorHandlerLike> = {
    uploadImage: {
      canExecute: () => options.canUploadImage(),
      execute: (editor) => {
        openImagePicker(editor)
        return true
      },
      isActive: () => false,
      isDisabled: () => !options.canUploadImage()
    },
    uploadFile: {
      canExecute: () => options.canUploadImage(),
      execute: (editor) => {
        openFilePicker(editor)
        return true
      },
      isActive: () => false,
      isDisabled: () => !options.canUploadImage()
    }
  }

  function openImagePicker(editor: EditorLike) {
    if (!options.canUploadImage()) {
      return
    }

    pendingEditor.value = editor
    currentEditor.value = editor
    imageInputRef.value?.click()
  }

  function openFilePicker(editor: EditorLike) {
    if (!options.canUploadImage()) {
      return
    }

    pendingFileEditor.value = editor
    currentEditor.value = editor
    fileInputRef.value?.click()
  }

  function isImageFile(file: File) {
    return file.type.startsWith('image/')
  }

  function getImageFilesFromDataTransfer(dataTransfer: DataTransfer | null) {
    if (!dataTransfer) {
      return []
    }

    return Array.from(dataTransfer.files).filter(isImageFile)
  }

  function insertUploadedImage(editor: EditorLike, imageUrl: string, fileName: string, position?: number) {
    const focused = editor.chain().focus()
    const chain = typeof position === 'number' && focused.setTextSelection
      ? focused.setTextSelection(position)
      : focused

    if (chain.setImage) {
      chain.setImage({ src: imageUrl, alt: fileName }).run()
    } else if (chain.insertContent) {
      chain.insertContent(`![${fileName}](${imageUrl})`).run()
    }
  }

  function insertUploadedFileLink(editor: EditorLike, fileUrl: string, fileName: string) {
    const content = {
      type: 'text',
      text: fileName,
      marks: [
        {
          type: 'link',
          attrs: { href: fileUrl }
        }
      ]
    }

    const chain = editor.chain().focus()
    if (chain.insertContent) {
      chain.insertContent(content).run()
      return
    }

    editor.chain().focus().insertContent?.(`[${fileName}](${fileUrl})`).run()
  }

  async function uploadAndInsertImages(editor: EditorLike, files: File[], position?: number) {
    for (const file of files) {
      const imageUrl = await options.uploadImage(file)
      if (imageUrl) {
        insertUploadedImage(editor, imageUrl, file.name, position)
      }
    }
  }

  function bindEditor(editor: EditorLike) {
    if (currentEditor.value === editor) {
      return true
    }

    currentEditor.value = editor
    return true
  }

  async function onImageInputChange(event: Event) {
    const input = event.target as HTMLInputElement
    const editor = pendingEditor.value
    const file = input.files?.[0]

    if (!file || !editor) {
      input.value = ''
      return
    }

    const imageUrl = await options.uploadImage(file)
    if (imageUrl) {
      insertUploadedImage(editor, imageUrl, file.name)
    }

    input.value = ''
  }

  async function onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement
    const editor = pendingFileEditor.value
    const file = input.files?.[0]

    if (!file || !editor) {
      input.value = ''
      return
    }

    const fileUrl = await options.uploadFile(file)
    if (fileUrl) {
      insertUploadedFileLink(editor, fileUrl, file.name)
    }

    input.value = ''
  }

  function isExternalHref(href: string) {
    try {
      const url = new URL(href, window.location.href)
      return url.origin !== window.location.origin
    } catch {
      return false
    }
  }

  watch(currentEditor, (editor) => {
    if (detachEditorListeners) {
      detachEditorListeners()
      detachEditorListeners = null
    }

    const target = editor?.view?.dom
    if (!target) {
      return
    }

    const setModifierCursorState = (isPressed: boolean) => {
      target.classList.toggle('editoro-link-modifier', isPressed)
    }

    const onDrop = async (event: DragEvent) => {
      const files = getImageFilesFromDataTransfer(event.dataTransfer || null)
      if (files.length === 0) {
        return
      }

      event.preventDefault()
      const dropPos = editor.view?.posAtCoords?.({
        left: event.clientX,
        top: event.clientY
      })?.pos

      await uploadAndInsertImages(editor, files, dropPos)
    }

    const onPaste = async (event: ClipboardEvent) => {
      const files = getImageFilesFromDataTransfer(event.clipboardData || null)
      if (files.length === 0) {
        return
      }

      event.preventDefault()
      await uploadAndInsertImages(editor, files)
    }

    const onClick = (event: MouseEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return
      }

      const targetNode = event.target
      if (!(targetNode instanceof HTMLElement)) {
        return
      }

      const anchor = targetNode.closest('a')
      if (!anchor) {
        return
      }

      const href = anchor.getAttribute('href') || ''
      if (!href) {
        return
      }

      event.preventDefault()
      if (isExternalHref(href)) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        window.location.assign(href)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        setModifierCursorState(true)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        setModifierCursorState(false)
      }
    }

    const onWindowBlur = () => {
      setModifierCursorState(false)
    }

    target.addEventListener('drop', onDrop)
    target.addEventListener('paste', onPaste)
    target.addEventListener('click', onClick)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onWindowBlur)

    detachEditorListeners = () => {
      target.removeEventListener('drop', onDrop)
      target.removeEventListener('paste', onPaste)
      target.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onWindowBlur)
      setModifierCursorState(false)
    }
  }, { flush: 'post' })

  onBeforeUnmount(() => {
    if (detachEditorListeners) {
      detachEditorListeners()
      detachEditorListeners = null
    }
  })

  return {
    imageInputRef,
    fileInputRef,
    editorHandlers,
    bindEditor,
    onImageInputChange,
    onFileInputChange
  }
}
