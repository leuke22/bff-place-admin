export interface IResponse {
    success: boolean
    error?: number;
    errorMessage?: string;
    errorDescription?: string;
}

export interface IListResponse<T> extends IResponse {
    response: {
        count: number
        rows: Array<T>
    }
}