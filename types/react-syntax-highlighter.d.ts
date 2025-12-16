declare module 'react-syntax-highlighter' {
  const jsx: any;
  export const Light: any;
  export default jsx;
}

declare module 'react-syntax-highlighter/dist/cjs/languages/hljs/*' {
  const lang: any;
  export default lang;
}

declare module 'react-syntax-highlighter/dist/cjs/styles/hljs' {
  export const docco: any;
} 