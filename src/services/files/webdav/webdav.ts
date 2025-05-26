import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type {
  FileStat, Headers, GetDirectoryContentsOptions, ResponseDataDetailed, StatOptions, WebDAVParsingContext,
  DAVResult, DAVResultResponseProps, DAVResultResponse, WebDAVClientOptions, FetchFunction, GetFileContentsOptions,
  PutFileContentsOptions, CopyFileOptions, MoveOptions, CreateDirectoryOptions, DeleteOptions
} from './type';
import { basename } from 'pathe';
import { isSubPath } from '@/utils/pathUtil';
import { CodeError } from '@/services/codeService';
import { statusCode } from '@/utils/statusCodes';
import { calculateDataLength } from '@/utils/fileUtil';



// 其他接口保持不变...
export const createClient = (options: WebDAVClientOptions): WebDAVClient | null => {
  try {
    const client = new WebDAVClient(options);
    return client
  } catch (e) {
    return null
  }
}
class WebDAVClient {
  private baseUrl: string;
  private headers: Headers;
  private xmlParser: XMLParser;
  private _fetch: FetchFunction;

  constructor(options: WebDAVClientOptions) {
    // 标准化baseUrl
    this.baseUrl = options.baseUrl.endsWith('/')
      ? options.baseUrl.slice(0, -1)
      : options.baseUrl;
    // 直接提取 fetch 方法调用（丢失 this 绑定）
    this._fetch = options._fetch ?? window.fetch.bind(window);;
    // 初始化headers
    this.headers = {
      'Content-Type': 'application/xml',
      ...options.headers
    };

    // 设置认证
    this.setupAuthentication(options);

    // 初始化XML处理器
    const parsingContext = {
      attributeNamePrefix: '@_',
      attributeParsers: [],
      tagParsers: [this.displaynameTagParser]
    };
    this.xmlParser = this.getParser(parsingContext);
  }
  private getParser({
    attributeNamePrefix,
    attributeParsers,
    tagParsers
  }: WebDAVParsingContext): XMLParser {
    return new XMLParser({
      allowBooleanAttributes: true,
      attributeNamePrefix,
      textNodeName: "text",
      ignoreAttributes: false,
      removeNSPrefix: true,
      numberParseOptions: {
        hex: true,
        leadingZeros: false
      },
      attributeValueProcessor(_, attrValue, jPath) {
        for (const processor of attributeParsers) {
          try {
            const value = processor(jPath, attrValue);
            if (value !== attrValue) {
              return value;
            }
          } catch (error) {
            // skipping this invalid parser
          }
        }
        return attrValue;
      },
      tagValueProcessor(tagName, tagValue, jPath) {
        for (const processor of tagParsers) {
          try {
            const value = processor(jPath, tagValue);
            if (value !== tagValue) {
              return value;
            }
          } catch (error) {
            // skipping this invalid parser
          }
        }
        return tagValue;
      },
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return ['multistatus.response', 'propstat'].includes(jpath);
      }
    });
  }

  /**
      * 设置认证信息
      */
  private setupAuthentication(options: WebDAVClientOptions): void {
    switch (options.authType) {
      case 'basic':
        if (!options.username || !options.password) {
          throw new CodeError(statusCode.AUTHEN_ERROR_NEED_USERNAME_PASSWORD);
        }
        const credentials = btoa(`${options.username}:${options.password}`);
        this.headers['Authorization'] = `Basic ${credentials}`;
        break;

      default:
        // 默认不设置认证
        break;
    }
  }

  /**
   * 特殊处理 displayname 属性，防止被错误解析
   */
  private displaynameTagParser(path: string, value: string): string | void {
    if (path.endsWith('propstat.prop.displayname')) {
      // 不要解析 displayname，防止如 '2024.10' 被解析为数字 2024.1
      return;
    }
    return value;
  }
  private normalizeResourcePath(rawPath: string, isDir?: boolean): string {
    let url: string;
    if (isSubPath(this.baseUrl, rawPath)) {
      url = rawPath;
    } else {
      url = `${this.baseUrl}/${rawPath}`;
    }
    url = encodeURI(url);
    // 智能处理结尾斜杠
    if (isDir) {
      return url.endsWith('/') ? url : `${url}/`;
    } else if (isDir === false) {
      return url.endsWith('/') ? url.slice(0, -1) : url;
    }
    return url;
  }
  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.headers,
      ...(options.headers || {})
    };
    let response: Response;
    try {
      response = await this._fetch(path, {
        ...options,
        headers
      });
      if (!response.ok) {
        throw new CodeError(statusCode.WEBDAV_REQUEST_FAILED, { detail: `${response.status} , ${response.statusText}` });
      }
    } catch (e: any) {
      console.log(e)
      if (e.message.startsWith("Response")) {
        response = new Response();
      } else {
        throw e;
      }
    }
    return response;
  }

  /**
   * 从 DAV 属性准备文件状态对象
   */
  private prepareFileFromProps(
    props: DAVResultResponseProps,
    filename: string,
    isDetailed: boolean = false
  ): FileStat {
    // 提取属性
    const {
      getlastmodified: lastMod = '',
      getcontentlength: rawSize = '0',
      resourcetype: resourceType = null,
      getcontenttype: mimeType = null,
      getetag: etag = null
    } = props;

    // 确定资源类型
    const stat: FileStat = {
      basename: basename(filename),
      lastmod: lastMod,
      size: parseInt(rawSize, 10),
      isDir: resourceType?.collection !== undefined,
      etag: typeof etag === 'string' ? etag.replace(/"/g, '') : null
    };

    if (!stat.isDir) {
      stat.mime = mimeType?.split(';')[0] || '';
    }

    if (isDetailed) {
      // 确保 displayname 保持为字符串
      if (typeof props.displayname !== 'undefined') {
        props.displayname = String(props.displayname);
      }
      stat.props = props;
    }

    return stat;
  }
  /**
   * 解析 XML 响应
   */
  private async parseXMLResponse(response: Response): Promise<DAVResult> {
    const text = await response.text();
    const result = this.xmlParser.parse(text);
    // 确保响应结构标准化
    if (!result.multistatus) {
      throw new CodeError(statusCode.INVALID_RESPONSE, { detail: 'No root multistatus found' });
    }

    // 确保 response 是数组
    if (!Array.isArray(result.multistatus.response)) {
      result.multistatus.response = [result.multistatus.response];
    }

    return result as DAVResult;
  }

  /**
   * 解析文件状态
   */
  private parseStat(result: DAVResult, filename: string, isDetailed: boolean = false): FileStat {
    const response = result.multistatus.response[0];

    if (!response?.propstat) {
      throw new CodeError(statusCode.WEBDAV_REQUEST_FAILED, { detail: 'Failed getting item stat' });
    }

    const { prop, status } = response.propstat;
    const [_, code] = status.split(' ', 2);

    if (parseInt(code, 10) >= 400) {
      throw new CodeError(statusCode.WEBDAV_REQUEST_FAILED, { detail: status });
    }

    return this.prepareFileFromProps(prop, filename, isDetailed);
  }

  /**
   * 解析目录内容
   * 使用 item is DAVResultResponse & { propstat: NonNullable<DAVResultResponse['propstat']> } 作为类型谓词
   * 告诉 TypeScript 经过这个过滤函数后，item 一定会有 propstat 属性
   */
  private parseDirectoryContents(result: DAVResult, selfPath: string): FileStat[] {
    const _result = result.multistatus.response
      .filter((item): item is DAVResultResponse & { propstat: NonNullable<DAVResultResponse['propstat']> } => {
        return !!item.propstat
      })
      .map(item => {
        const filename = decodeURIComponent(item.href)
          .replace(this.baseUrl, '')
          .replace(/\/$/, '');
        return this.prepareFileFromProps(item.propstat.prop, filename);
      })
    _result.shift();
    return _result;
  }

  // 以下是 WebDAV 方法实现...
  async getDirectoryContents(
    path: string,
    options: GetDirectoryContentsOptions = {}
  ): Promise<FileStat[] | ResponseDataDetailed<FileStat[]>> {
    path = this.normalizeResourcePath(path, true);
    const response = await this.request(path, {
      method: 'PROPFIND',
      headers: {
        'Depth': options.deep ? 'infinity' : '1',
        ...options.headers
      },
    });

    const result = await this.parseXMLResponse(response);
    const contents = this.parseDirectoryContents(result, path)
    if (options.details) {
      return {
        data: contents,
        headers: Object.fromEntries(response.headers.entries()),
        status: response.status
      };
    }

    return contents;
  }

  async stat(
    path: string,
    options: StatOptions = {}
  ): Promise<FileStat | ResponseDataDetailed<FileStat>> {
    path = this.normalizeResourcePath(path, options.isDir);
    const response = await this.request(path, {
      method: 'PROPFIND',
      headers: {
        'Depth': '0',
        ...options.headers
      },
    });
    const result = await this.parseXMLResponse(response);
    console.log(result);
    const stat = this.parseStat(result, path, options.details);
    if (options.details) {
      return {
        data: stat,
        headers: Object.fromEntries(response.headers.entries()),
        status: response.status
      };
    }
    return stat;
  }

  async exists(path: string, isDir?: boolean): Promise<boolean> {
    try {
      await this.stat(path, { isDir });
      return true;
    } catch (e) {
      return false;
    }
  }

  async getFileContents(
    filename: string,
    options: GetFileContentsOptions = {}
  ): Promise<ArrayBuffer | string | ResponseDataDetailed<ArrayBuffer | string>> {
    filename = this.normalizeResourcePath(filename, false);
    const response = await this.request(filename, {
      method: 'GET',
      headers: options.headers
    });

    const result = options.format === 'text'
      ? await response.text()
      : await response.arrayBuffer();

    if (options.details) {
      return {
        data: result,
        headers: Object.fromEntries(response.headers.entries()),
        status: response.status
      };
    }

    return result;
  }
  async putFileContents(
    filename: string,
    data: string | ArrayBuffer,
    options: PutFileContentsOptions = {}
  ): Promise<boolean> {
    const { contentLength = true, overwrite = true } = options;
    filename = this.normalizeResourcePath(filename, false);
    const headers: Headers = {
      "Content-Type": "application/octet-stream"
    };
    if (contentLength === false) {
      // Skip, disabled
    } else if (typeof contentLength === "number") {
      headers["Content-Length"] = `${contentLength}`;
    } else {
      headers["Content-Length"] = `${calculateDataLength(data as string | ArrayBuffer)}`;
    }
    if (!overwrite) {
      headers["If-None-Match"] = "*";
    }
    await this.request(filename, {
      method: 'PUT',
      headers: options.headers,
      body: data
    });
    return true;
  }
  async delete(filename: string, options: DeleteOptions = {}): Promise<void> {
    filename = this.normalizeResourcePath(filename, options.isDir);
    await this.request(filename, {
      method: 'DELETE',
      ...options.headers
    });
  }

  async move(filename: string, destinationFilename: string, options: MoveOptions = {}): Promise<void> {
    filename = this.normalizeResourcePath(filename, options.isDir);
    destinationFilename = this.normalizeResourcePath(destinationFilename, options.isDir);
    const headers = {
      'Destination': destinationFilename,
      'Overwrite': options.overwrite ? 'T' : 'F',
      ...options.headers
    };
    console.log(filename, headers);

    await this.request(filename, {
      method: 'MOVE',
      headers
    });
  }

  async copyFile(filename: string, destination: string, options: CopyFileOptions = {}): Promise<void> {
    filename = this.normalizeResourcePath(filename, false);
    destination = this.normalizeResourcePath(destination, false);
    const headers = {
      'Destination': destination,
      'Overwrite': options.overwrite ? 'T' : 'F',
      ...options.headers
    };

    await this.request(filename, {
      method: 'COPY',
      headers
    });
  }
  async createDirectory(path: string, options: CreateDirectoryOptions = {}): Promise<void> {
    path = this.normalizeResourcePath(path, true);
    await this.request(path, {
      method: 'MKCOL',
      headers: options.headers
    });
  }
}

export default WebDAVClient;