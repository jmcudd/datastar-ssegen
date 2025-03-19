type HttpRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  json?: Function;
  on?: Function;
};

type HttpResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body?: Record<string, string> | string;
  setHeader: Function;
  write: Function;
};

type SendOptions = {
  eventId?: number | null;
  retryDuration?: number | null;
};

type MergeFragmentsOptions = {
  selector?: string | null;
  mergeMode?: string;
  settleDuration?: number;
  useViewTransition?: boolean | null;
  eventId?: number | null;
  retryDuration?: number | null;
};

type RemoveFragmentsOptions = {
  settleDuration?: number;
  useViewTransition?: boolean | null;
  eventId?: number | null;
  retryDuration?: number | null;
};

type MergeSignalsOptions = {
  onlyIfMissing?: boolean;
  eventId?: number | null;
  retryDuration?: number | null;
};

type ExecuteScriptOptions = {
  autoRemove?: boolean | null;
  eventId?: number | null;
  retryDuration?: number | null;
};

type ServerSentEventMethods = {
  _send: Function;
  ReadSignals: (signals: object) => Promise<object>;
  MergeFragments: (
    fragments: string[] | string,
    options: MergeFragmentsOptions
  ) => string;
  RemoveFragments: (
    selector: string,
    options: RemoveFragmentsOptions
  ) => string;
  MergeSignals: (signals: object, options: MergeSignalsOptions) => string;
  RemoveSignals: (paths: string[], options: SendOptions) => string;
  ExecuteScript: (script: string, options: ExecuteScriptOptions) => string;
};
