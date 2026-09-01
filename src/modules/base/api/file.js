import { request } from '@framework/utils/request';

const prefix = '/base';
const Api = {
  PageList: `${prefix}/file/pagelist`,
  Upload: `${prefix}/file/upload`,
  Download: `${import.meta.env.VITE_API_URL_PREFIX || '/api'}${prefix}/file/download`,
};

export function pageList(params) {
  return request.post({ url: Api.PageList, params });
}
export function uploadFile(file, name) {
  const params = new FormData();
  params.append('file', file);
  if (name) params.append('name', name);
  return request.post({
    url: Api.Upload,
    data: params,
    headers: { 'Content-Type': 'multipart/form-data;charset=UTF-8' },
  });
}
export function downloadUrl(uuid, name) {
  return `${Api.Download}/${uuid}?name=${encodeURIComponent(name || '')}`;
}
