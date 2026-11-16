// src/renderer/pages/_error/_error.js
// Generic error page fallback.

import { qs } from '../../utils/dom.js';
import { emptyState } from '../../components/empty-state.js';
import { t } from '../../i18n/t.js';

export async function init(container, ctx) {
  const { query, router } = ctx;
  const box = qs('#error-box', container);

  if (box) {
    const message = query?.message || t('errors.UNKNOWN');
    const es = emptyState({
      title: t('app.error'),
      description: message,
      icon: 'triangle-exclamation-point',
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
