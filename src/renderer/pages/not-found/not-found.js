// src/renderer/pages/not-found/not-found.js
// 404 Not Found page.

import { qs } from '../../utils/dom.js';
import { emptyState } from '../../components/empty-state.js';
import { t } from '../../i18n/t.js';

export async function init(container, ctx) {
  const { router } = ctx;
  const box = qs('#not-found-box', container);

  if (box) {
    const es = emptyState({
      title: t('notFound.title'),
      description: t('notFound.message'),
      icon: 'file-text',
      action: {
        text: t('notFound.btn'),
        onClick: () => router.navigate('/')
      }
    });
    box.appendChild(es);
  }

  return {
    destroy() {}
  };
}
