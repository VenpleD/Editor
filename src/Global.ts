export const GlobalConstants = {
  imageContainerCls: 'imageContainer',
  imageContainerTextareaCls: 'imageContainerTextarea',  
  imageContainerTextareaPlaceholder: '请输入内容',
  imageContainerImgCls: 'customImage',
  pgcH1ArrowRight: 'pgc-h1-arrow-right',
  pgcH1CenterLine: 'pgc-h1-center-line',
  pgcH1Decimal: 'pgc-h1-decimal',
  quoteBgCls: 'quote-bg',
  quoteBarCls: 'quote-bar',
  quoteImageCls: 'quote-image',
  bulletListCls: 'pgc-bullet-list',
  orderedListCls: 'pgc-ordered-list',
};

const styleMap = {
  fontStyle: {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strike: 'strike'
  },
  fontSize: {
    small: '16',
    medium: '18',
    large: '22',
    xlarge: '28'
  },
  align: {
    left: 'left',
    center: 'center',
    right: 'right',
    justify: 'justify'
  },
  fontColor: {
    black: '#000000',
    gray: '#888888',
    red: '#ff4d4f',
    yellow: '#faad14',
    blue: '#1890ff',
    green: '#52c41a'
  },
  bgColor: {
    bClear: 'transparent',
    bGray: '#4d2323',
    bYellow: '#4ddd23', 
    bBlue: '#23324d',
    bGreen: '#234d2d'
  },
  h1Style: {
    arrowRight: GlobalConstants.pgcH1ArrowRight,
    centerLine: GlobalConstants.pgcH1CenterLine,
    decimal: GlobalConstants.pgcH1Decimal
  },
  blockquoteStyle: {
    quoteBg: GlobalConstants.quoteBgCls,
    quoteBar: GlobalConstants.quoteBarCls,
    quoteImage: GlobalConstants.quoteImageCls
  },
  listStyle: {
    bullet: GlobalConstants.bulletListCls,
    ordered: GlobalConstants.orderedListCls,
  },
};

// 反向映射生成函数
function reverseMap(map: Record<string, string>) {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
}

// 合并所有正向和反向映射
const styleAllMap = {
  ...styleMap.fontSize,  
  ...styleMap.align,  
  ...styleMap.fontColor,  
  ...styleMap.bgColor,  
  ...styleMap.fontStyle,
  ...styleMap.h1Style,
  ...styleMap.blockquoteStyle,
  ...styleMap.listStyle,
};

const styleIdMap = {
    ...Object.fromEntries(Object.entries(styleMap.fontSize).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.align).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.fontColor).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.bgColor).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.fontStyle).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.h1Style).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.blockquoteStyle).map(([k, v]) => [v, k])),
    ...Object.entries(styleMap.listStyle).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {}),
}

const GlobalStyle = {
  getHtmlWidth: () => Math.min(540, window.innerWidth),
  getFontSize: () => Math.ceil(Math.min(540, window.innerWidth) / 9),
  convertToRem: (px: number) => {
    return Math.ceil(px * GlobalStyle.getFontSize() / 16) / 100;
  },
  convertToPx: (rem: string) => {
    const remValue = parseFloat(rem);
    return String(Math.floor(remValue * 16 * 100 / GlobalStyle.getFontSize()));
  },
  setCssVars: () => {
    const htmlWidth = GlobalStyle.getHtmlWidth();
    const fontSize = GlobalStyle.getFontSize();
    document.documentElement.style.setProperty('--html-width', htmlWidth + 'px');
    document.documentElement.style.setProperty('--html-font-size', fontSize + 'px');
    document.documentElement.style.setProperty('--html-h1-font-size', GlobalStyle.convertToRem(32) + 'rem');
  },
  styleIdMap,
  styleAllMap // 这里就是正反向都能查的map
};

export default GlobalStyle;