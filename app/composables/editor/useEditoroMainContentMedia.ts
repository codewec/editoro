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
      insertContent?: (content: string) => {
        run: () => boolean
      }
    }
  }
}

type EditorHandlerLike = {
  canExecute: (editor: EditorLike) => boolean
  execute: (editor: EditorLike) => unknown
  isActive: (editor: EditorLike) => boolean
  isDisabled?: (editor: EditorLike) => boolean
}

type EditoroMainContentMediaOptions = {
  canUploadImage: () => boolean
  uploadImage: (file: File) => Promise<string | null>
}

/**
 * Encapsulates image upload interactions for editor toolbar, DnD and paste flows.
 * Used by `app/components/editoro/MainContent.vue`.
 */
export function useEditoroMainContentMedia(options: EditoroMainContentMediaOptions) {
  const imageInputRef = ref<HTMLInputElement>()
  const pendingEditor = ref<EditorLike>()
  const currentEditor = ref<EditorLike>()

  let detachEditorDnDListeners: (() => void) | null = null

  const editorHandlers: Record<string, EditorHandlerLike> = {
    uploadImage: {
      canExecute: () => options.canUploadImage(),
      execute: (editor) => {
        openImagePicker(editor)
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

  watch(currentEditor, (editor) => {
    if (detachEditorDnDListeners) {
      detachEditorDnDListeners()
      detachEditorDnDListeners = null
    }

    const target = editor?.view?.dom
    if (!target) {
      return
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

    target.addEventListener('drop', onDrop)
    target.addEventListener('paste', onPaste)

    detachEditorDnDListeners = () => {
      target.removeEventListener('drop', onDrop)
      target.removeEventListener('paste', onPaste)
    }
  }, { flush: 'post' })

  onBeforeUnmount(() => {
    if (detachEditorDnDListeners) {
      detachEditorDnDListeners()
      detachEditorDnDListeners = null
    }
  })

  return {
    imageInputRef,
    editorHandlers,
    bindEditor,
    onImageInputChange
  }
}
