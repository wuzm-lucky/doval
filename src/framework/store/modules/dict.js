import { computed, markRaw, ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';

import { getDetailByCode } from '@framework/api/dict';

const STORAGE_KEY = 'doval.dict';
export const DICT_CACHE_TTL = 30 * 60 * 1000;

/**
 * 校验字典内容及编码，防止损坏的数据被当作有效缓存。
 * @author wuzm
 */
function isDict(data, code) {
  return (
    data?.code === code &&
    Array.isArray(data.dictItemList) &&
    data.dictItemList.every((item) => item && typeof item === 'object' && !Array.isArray(item))
  );
}

/**
 * 数字字典统一数字匹配，字符串字典保留前导零；空值不参与匹配。
 * @author wuzm
 */
function valueKey(value, digit) {
  if (value === null || value === undefined) return undefined;
  if (!digit) return String(value);
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (typeof value === 'string' && !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/**
 * 按编码管理业务字典；持久化仅保存数据和时间，请求及查询索引只驻留内存。
 * @author wuzm
 */
export const useDictStore = defineStore(
  'dict',
  () => {
    const data = shallowRef({});
    const states = ref(Object.create(null));
    const indexes = new Map();
    const pending = new Map();

    /**
     * 排序字典项并建立索引，整体替换以通知全部消费者，重复值采用排序后的第一项。
     * @author wuzm
     */
    function install(code, entry) {
      const items = [...entry.data.dictItemList].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
      const dict = markRaw({ ...entry.data, dictItemList: items });
      const index = new Map();
      for (const item of items) {
        const key = valueKey(item.value, dict.digit === true);
        if (key !== undefined && !index.has(key)) index.set(key, item);
      }
      indexes.set(code, index);
      const installed = { ...entry, data: dict };
      data.value = { ...data.value, [code]: installed };
      return installed;
    }

    /**
     * 持久化恢复后过滤损坏项并重建排序与内存索引，保留合法过期数据用于展示。
     * @author wuzm
     */
    function restoreIndexes() {
      indexes.clear();
      const cached = data.value;
      data.value = {};
      if (!cached || typeof cached !== 'object' || Array.isArray(cached)) return;
      for (const [code, entry] of Object.entries(cached)) {
        if (
          isDict(entry?.data, code) &&
          Number.isFinite(entry.loadedAt) &&
          Number.isFinite(entry.expiresAt) &&
          entry.expiresAt >= entry.loadedAt
        )
          install(code, entry);
      }
    }

    /**
     * 按需恢复、加载字典；过期保留旧数据，同编码并发请求共享结果，失败可再次加载。
     * @param {string} code 全局唯一编码，区分大小写
     * @param {boolean} force 是否忽略有效期重新请求
     * @author wuzm
     */
    function loadDict(code, force = false) {
      if (typeof code !== 'string' || !code.trim()) return Promise.reject(new Error('字典编码不能为空'));
      if (pending.has(code)) return pending.get(code);
      const entry = Object.hasOwn(data.value, code) ? data.value[code] : undefined;
      if (!force && entry?.expiresAt > Date.now()) return Promise.resolve(entry.data);
      states.value[code] = { loading: true, error: null };
      const promise = Promise.resolve()
        .then(() => getDetailByCode(code))
        .then((data) => {
          if (!isDict(data, code)) throw new Error(`字典 ${code} 返回的数据格式不正确`);
          const loadedAt = Date.now();
          const installed = install(code, { data, loadedAt, expiresAt: loadedAt + DICT_CACHE_TTL });
          return installed.data;
        })
        .catch((error) => {
          states.value[code].error = error;
          throw error;
        })
        .finally(() => {
          states.value[code].loading = false;
          pending.delete(code);
        });
      pending.set(code, promise);
      return promise;
    }

    /**
     * 对多个编码去重后并行加载；单项失败不取消其他字典的加载。
     * @author wuzm
     */
    function loadDicts(codes) {
      return Promise.all([...new Set(codes)].map((code) => loadDict(code)));
    }

    /**
     * 同步读取字典项，不发起请求、不访问浏览器存储。
     * @author wuzm
     */
    function getItem(code, value) {
      const dict = data.value[code]?.data;
      return indexes.get(code)?.get(valueKey(value, dict?.digit === true));
    }

    /**
     * 同步读取文本；空值显示占位，未知值保留原值便于定位配置问题。
     * @author wuzm
     */
    function getLabel(code, value) {
      if (value === null || value === undefined || value === '') return '—';
      return getItem(code, value)?.label ?? String(value);
    }

    return { data, states, loadDict, loadDicts, getItem, getLabel, restoreIndexes };
  },
  {
    persist: {
      key: STORAGE_KEY,
      storage: localStorage,
      pick: ['data'],
      afterHydrate: ({ store }) => store.restoreIndexes(),
    },
  },
);

/**
 * 页面或弹窗声明所需字典；自动加载的错误通过 error 暴露，reload 返回可等待的 Promise。
 * options 为共享只读约定，页面添加“全部”等选项时应创建新数组，不修改字典项。
 * @param {string} code 当前使用的固定字典编码
 * @author wuzm
 */
export function useDict(code) {
  const store = useDictStore();
  const ready = store.loadDict(code);
  // 自动加载的拒绝已有状态承接，避免未等待 ready 时产生未处理异常。
  ready.catch(() => {});
  return {
    options: computed(() => store.data[code]?.data.dictItemList ?? []),
    loading: computed(() => store.states[code]?.loading ?? false),
    error: computed(() => store.states[code]?.error ?? null),
    getItem: (value) => store.getItem(code, value),
    getLabel: (value) => store.getLabel(code, value),
    reload: () => store.loadDict(code, true),
    ready,
  };
}

/**
 * 供需要等待多本字典完成的页面使用，必须在 Pinia 安装后调用。
 * @author wuzm
 */
export function loadDicts(codes) {
  return useDictStore().loadDicts(codes);
}
