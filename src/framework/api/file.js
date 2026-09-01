import { request } from '@framework/utils/request';

const Api = {
  PageList: '/base/file/pagelist',
  Upload: '/base/file/upload',
  Download: '/api/base/file/download',
};

export function pageList(params) {
  return request.post({
    url: Api.PageList,
    params,
  });
}

export function uploadFile(file, name) {
  return request.upload('file', file, {
    url: Api.Upload,
  });
}

export function downloadUrl(uuid, name) {
  return Api.Download + '/' + uuid + '?name=' + encodeURIComponent(name);
}
