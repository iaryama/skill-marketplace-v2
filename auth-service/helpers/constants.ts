export enum Log {
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export enum HTTP_STATUS_CODE {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    ACCESS_FORBIDDEN = 403,
    METHOD_NOT_ALLOWED = 405,
    INTERNAL_SERVER_ERROR = 500
}

export const ACCESS_EXPIRY = '15m';
export const REFRESH_EXPIRY_SEC = 3 * 24 * 3600;