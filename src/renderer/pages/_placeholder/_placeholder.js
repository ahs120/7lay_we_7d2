// src/renderer/pages/_placeholder/_placeholder.js
// Placeholder page for routes to be developed in future parts.

import { qs } from '../../utils/dom.js';
import { emptyState } from '../../components/empty-state.js';
import { t } from '../../i18n/t.js';

export async function init(container, ctx) {
  const { route, router } = ctx;
  const box = qs('#placeholder-box', container);

  if (box) {
    const title = route?.titleKey ? t(route.titleKey) : t('placeholder.in_development');
    const es = emptyState({
      title,
      description: t('placeholder.dev_notice'),
      icon: route?.icon || 'coffee',
      action: {
        text: t('placeholder.back_home'),
        onClick: () => router.navigate('/')
      }
    });
    box.appendChild(es);
  }

  return {
    destroy() {}
  };
}
