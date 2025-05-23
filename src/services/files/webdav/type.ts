export interface FileStat {
  basename: string;
  lastmod: string;
  size: number;
  isDir: boolean;
  etag: string | null;
  mime?: string;
  props?: DAVResultResponseProps;
}
export interface DAVResultResponseProps {
  displayname: string;
  resourcetype: {
    collection?: unknown;
  };
  getlastmodified?: string;
  getetag?: string;
  getcontentlength?: string;
  getcontenttype?: string;
  "quota-available-bytes"?: string | number;
  "quota-used-bytes"?: string | number;

  [additionalProp: string]: unknown;
}

export interface GetDirectoryContentsOptions {
  deep?: boolean;
  details?: boolean;
  headers?: Headers;
  glob?: string;
}

export interface ResponseDataDetailed<T> {
  data: T;
  headers: Headers;
  status: number;
}


export interface StatOptions {
  details?: boolean;
  headers?: Headers;
  isDir?: boolean;
}
export type Headers = Record<string, string>;

// 配置接口
export interface WebDAVParsingContext {
  attributeNamePrefix?: string;
  attributeParsers: Array<(path: string, value: string) => any>;
  tagParsers: Array<(path: string, value: string) => any>;
}

// WebDAV 响应结构
export interface DAVResult {
  multistatus: {
    response: Array<DAVResultResponse>;
  };
}

export interface DAVResultResponse {
  href: string;
  propstat?: {
    prop: DAVResultResponseProps;
    status: string;
  };
  status?: string;
}
export interface WebDAVClientOptions {
  baseUrl: string;
  authType: 'basic' | 'none';
  username?: string;
  password?: string;
  headers?: Headers;
  _fetch: FetchFunction;
}
export interface GetFileContentsOptions {
  details?: boolean;
  format?: 'binary' | 'text';
  headers?: Headers;
  onDownloadProgress?: (progress: ProgressEvent) => void;
}
export type FetchFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface PutFileContentsOptions {
  overwrite?: boolean | number;
  headers?: Headers;
  onUploadProgress?: (progress: ProgressEvent) => void;
  contentLength?: boolean;
}
export interface CopyFileOptions {
  overwrite?: boolean;
  headers?: Headers;
}
export interface MoveOptions {
  overwrite?: boolean;
  headers?: Headers;
  isDir?: boolean;
}
export interface CreateDirectoryOptions {
  recursive?: boolean;
  headers?: Headers;
}
export interface DeleteOptions {
  recursive?: boolean;
  headers?: Headers;
  isDir?: boolean;
}