/**
 * 将后端不同分页响应统一为页面组件使用的行数据与总数结构。
 *
 * @param {object | undefined | null} pageData 后端分页响应
 * @returns {{ rows: Array, total: number }} 标准分页数据
 */
export function normalizePage(pageData) {
  if (!pageData) {
    return { rows: [], total: 0 };
  }

  return {
    rows: pageData.rows || pageData.content || pageData.records || [],
    total: pageData.total ?? pageData.totalElements ?? pageData.totalCount ?? 0,
  };
}
