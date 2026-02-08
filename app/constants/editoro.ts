import type { EditorSuggestionItems, EditorToolbarItems } from '~/types/editoro'

type Translator = (key: string, params?: Record<string, unknown>) => string

export function createEditorToolbarItems(t: Translator) {
  return [
    [
      { kind: 'undo', icon: 'i-lucide-undo-2', tooltip: { text: t('toolbar.undo') } },
      { kind: 'redo', icon: 'i-lucide-redo-2', tooltip: { text: t('toolbar.redo') } }
    ],
    [
      { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: t('toolbar.bold') } },
      { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: t('toolbar.italic') } },
      { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: t('toolbar.strike') } },
      { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: t('toolbar.code') } }
    ],
    [
      { kind: 'heading', level: 1, label: 'H1', tooltip: { text: t('toolbar.h1') } },
      { kind: 'heading', level: 2, label: 'H2', tooltip: { text: t('toolbar.h2') } },
      { kind: 'heading', level: 3, label: 'H3', tooltip: { text: t('toolbar.h3') } },
      { kind: 'paragraph', icon: 'i-lucide-pilcrow', tooltip: { text: t('toolbar.paragraph') } }
    ],
    [
      { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: t('toolbar.bulletList') } },
      { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: t('toolbar.orderedList') } },
      { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: t('toolbar.quote') } },
      { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: t('toolbar.codeBlock') } },
      { kind: 'horizontalRule', icon: 'i-lucide-minus', tooltip: { text: t('toolbar.divider') } }
    ],
    [
      { kind: 'uploadImage', icon: 'i-lucide-image-plus', tooltip: { text: t('toolbar.uploadImage') }, 'aria-label': t('toolbar.uploadImage') }
    ]
  ] satisfies EditorToolbarItems
}

export function createEditorSuggestionItems(t: Translator) {
  return [
    [
      { type: 'label', label: t('suggestion.text') },
      { kind: 'paragraph', label: t('toolbar.paragraph'), icon: 'i-lucide-type' },
      { kind: 'heading', level: 1, label: t('suggestion.heading1'), icon: 'i-lucide-heading-1' },
      { kind: 'heading', level: 2, label: t('suggestion.heading2'), icon: 'i-lucide-heading-2' },
      { kind: 'heading', level: 3, label: t('suggestion.heading3'), icon: 'i-lucide-heading-3' }
    ],
    [
      { type: 'label', label: t('suggestion.lists') },
      { kind: 'bulletList', label: t('toolbar.bulletList'), icon: 'i-lucide-list' },
      { kind: 'orderedList', label: t('toolbar.orderedList'), icon: 'i-lucide-list-ordered' }
    ],
    [
      { type: 'label', label: t('suggestion.insert') },
      { kind: 'uploadImage', label: t('suggestion.image'), icon: 'i-lucide-image-plus' },
      { kind: 'blockquote', label: t('toolbar.quote'), icon: 'i-lucide-text-quote' },
      { kind: 'codeBlock', label: t('toolbar.codeBlock'), icon: 'i-lucide-square-code' },
      { kind: 'horizontalRule', label: t('toolbar.divider'), icon: 'i-lucide-separator-horizontal' }
    ]
  ] satisfies EditorSuggestionItems
}
