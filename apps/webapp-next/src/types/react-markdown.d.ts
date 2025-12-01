declare module 'react-markdown' {
  import { ReactNode } from 'react';

  interface ReactMarkdownProps {
    children: string;
    remarkPlugins?: any[];
    components?: Record<string, (props: any) => JSX.Element>;
  }

  const ReactMarkdown: (props: ReactMarkdownProps) => JSX.Element;
  export default ReactMarkdown;
}

declare module 'remark-gfm' {
  const remarkGfm: any;
  export default remarkGfm;
}
