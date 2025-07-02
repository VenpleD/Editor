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
    red: '#ff4d4f',
    yellow: '#faad14',
    blue: '#1890ff',
    green: '#52c41a'
  },
  bgColor: {
    red: '#4d2323',
    yellow: '#4d3a23',
    blue: '#23324d',
    green: '#234d2d'
  }
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
};

const styleIdMap = {
    ...Object.fromEntries(Object.entries(styleMap.fontSize).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.align).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.fontColor).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.bgColor).map(([k, v]) => [v, k])),
    ...Object.fromEntries(Object.entries(styleMap.fontStyle).map(([k, v]) => [v, k])),
}

const GlobalStyle = {
  getHtmlWidth: () => Math.min(540, window.innerWidth),
  getFontSize: () => Math.ceil(Math.min(540, window.innerWidth) / 9),
  setCssVars: () => {
    const htmlWidth = GlobalStyle.getHtmlWidth();
    const fontSize = GlobalStyle.getFontSize();
    document.documentElement.style.setProperty('--html-width', htmlWidth + 'px');
    document.documentElement.style.setProperty('--html-font-size', fontSize + 'px');
  },
  convertToRem: (px: number) => {
    return Math.ceil(px * GlobalStyle.getFontSize() / 16) / 100;
  },
  convertToPx: (rem: string) => {
    const remValue = parseFloat(rem);
    return String(Math.floor(remValue * 16 * 100 / GlobalStyle.getFontSize()));
  },
  styleIdMap,
  styleAllMap // 这里就是正反向都能查的map
};

export const GolobalConstants = {
  imageContainerCls: 'imageContainer',
  imageContainerTextareaCls: 'imageContainerTextarea',  
  imageContainerTextareaPlaceholder: '请输入内容',
  imageContainerImgCls: 'customImage',
}

export default GlobalStyle;