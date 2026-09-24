<template>
  <t-popup expand-animation placement="bottom-right" trigger="click" @visible-change="handleVisibleChange">
    <template #content>
      <div class="header-msg">
        <div class="header-msg-top">
          <p>{{ t('layout.notice.title') }}</p>
          <t-button
            v-if="messages.length > 0"
            class="clear-btn"
            variant="text"
            theme="primary"
            :loading="readingAll"
            @click="markAllRead"
            >全部已读</t-button
          >
        </div>
        <t-list v-if="messages.length > 0" class="narrow-scrollbar" :split="false">
          <t-list-item v-for="item in messages" :key="item.id" @click="goDetail(item.id)">
            <div class="message-main">
              <p class="msg-content">{{ item.title }}</p>
              <p class="msg-type">{{ getTypeLabel(item.type) }}</p>
            </div>
            <p class="msg-time">{{ item.createTime }}</p>
            <template #action>
              <t-button size="small" variant="outline" @click.stop="markRead(item.id)">
                {{ t('layout.notice.setRead') }}
              </t-button>
            </template>
          </t-list-item>
        </t-list>

        <div v-else class="empty-list">
          <asset-empty-icon class="empty-icon" />
          <p>{{ t('layout.notice.empty') }}</p>
        </div>
        <div v-if="messages.length > 0" class="header-msg-bottom">
          <t-button class="header-msg-bottom-link" variant="text" theme="default" block @click="goDetail()">{{
            t('layout.notice.viewAll')
          }}</t-button>
        </div>
      </div>
    </template>
    <t-badge :count="unreadCount" :offset="[4, 4]">
      <t-button theme="default" shape="square" variant="text">
        <t-icon name="mail" />
      </t-button>
    </t-badge>
  </t-popup>
</template>
<script setup>
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';

import { getUnreadCount, pageList, read } from '@framework/api/message';
import AssetEmptyIcon from '@framework/assets/assets-empty.svg?component';
import { t } from '@framework/locales';
import { normalizePage } from '@framework/utils/page';

const router = useRouter();
const messages = ref([]);
const unreadCount = ref(0);
const readingAll = ref(false);

const typeLabels = { ANNOUNCEMENT: '系统公告', REMINDER: '提醒', MESSAGE: '消息' };

const getTypeLabel = (type) => typeLabels[type] || type || '消息';

/** 同步通知角标和下拉列表的最新未读消息。 */
const refreshMessages = async () => {
  const [count, page] = await Promise.all([getUnreadCount(), pageList({ read: false }, { page: 1, size: 6 })]);
  unreadCount.value = Number(count) || 0;
  messages.value = normalizePage(page).rows;
};

const markRead = async (id) => {
  await read(id);
  await refreshMessages();
};

/** 逐页清理未读消息，适配服务端暂未提供批量已读接口的契约。 */
const markAllRead = async () => {
  readingAll.value = true;
  try {
    let page;
    do {
      page = normalizePage(await pageList({ read: false }, { page: 1, size: 100 }));
      await Promise.all(page.rows.map((item) => read(item.id)));
    } while (page.rows.length > 0);
    await refreshMessages();
  } finally {
    readingAll.value = false;
  }
};

const handleVisibleChange = (visible) => {
  if (visible) refreshMessages();
};

/** 有消息主键时打开该消息详情，否则进入个人消息中心。 */
const goDetail = (id) => {
  const query = id ? { id } : undefined;
  router.push({ path: '/message/index', query });
};

onMounted(refreshMessages);
</script>
<style lang="less" scoped>
.header-msg {
  width: 400px;
  margin: calc(0px - var(--td-comp-paddingTB-xs)) calc(0px - var(--td-comp-paddingLR-s));

  .empty-list {
    text-align: center;
    padding: var(--td-comp-paddingTB-xxl) 0;
    font: var(--td-font-body-medium);
    color: var(--td-text-color-secondary);

    .empty-icon {
      width: var(--td-comp-size-xxxxl);
      height: var(--td-comp-size-xxxxl);
    }

    p {
      margin-top: var(--td-comp-margin-xs);
    }
  }

  &-top {
    position: relative;
    font: var(--td-font-title-medium);
    color: var(--td-text-color-primary);
    text-align: left;
    padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-xl) 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .clear-btn {
      right: calc(var(--td-comp-paddingTB-l) - var(--td-comp-paddingLR-xl));
    }
  }

  &-bottom {
    align-items: center;
    display: flex;
    justify-content: center;
    padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-s);
    border-top: 1px solid var(--td-component-stroke);

    &-link {
      text-decoration: none;
      cursor: pointer;
      color: var(--td-text-color-placeholder);
    }
  }

  .t-list {
    height: calc(100% - 104px);
    padding: var(--td-comp-margin-s) var(--td-comp-margin-s);
  }

  .t-list-item {
    overflow: hidden;
    width: 100%;
    padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
    border-radius: var(--td-radius-default);
    font: var(--td-font-body-medium);
    color: var(--td-text-color-primary);
    cursor: pointer;
    transition: background-color 0.2s linear;

    &:hover {
      background-color: var(--td-bg-color-container-hover);

      .msg-content {
        color: var(--td-brand-color);
      }

      .t-list-item__action {
        button {
          bottom: var(--td-comp-margin-l);
          opacity: 1;
        }
      }

      .msg-time {
        bottom: -6px;
        opacity: 0;
      }
    }

    .msg-content {
      margin-bottom: var(--td-comp-margin-s);
    }

    .msg-type {
      color: var(--td-text-color-secondary);
    }

    .t-list-item__action {
      button {
        opacity: 0;
        position: absolute;
        right: var(--td-comp-margin-xxl);
        bottom: -6px;
      }
    }

    .msg-time {
      transition: all 0.2s ease;
      opacity: 1;
      position: absolute;
      right: var(--td-comp-margin-xxl);
      bottom: var(--td-comp-margin-l);
      color: var(--td-text-color-secondary);
    }
  }

  .message-main {
    min-width: 0;
  }
}
</style>
