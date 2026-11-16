// src/renderer/pages/forbidden/forbidden.js
// 403 Forbidden page.

import { qs } from '../../utils/dom.js';
import { emptyState } from '../../components/empty-state.js';
import { t } from '../../i18n/t.js';

export async function init(container, ctx) {
  const { router } = ctx;
  const box = qs('#forbidden-box', container);

  if (box) {
    const es = emptyState({
      title: t('forbidden.title'),
      description: t('forbidden.message'),
      icon: 'ban',
      action: {
        text: t('forbidden.btn'),
        onClick: () => router.navigate('/')
      }
    });
    box.appendChild(es);
  }

  return {
    destroy() {}
  };
}
