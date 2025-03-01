import { Plugin } from 'prosemirror-state';

export default function placeholder(text, className) {
  const update = (view) => {
    if (view.state.doc.textContent || view.state.doc.firstChild?.content.size > 0) {
      view.dom.removeAttribute('data-placeholder');
      view.dom.classList.remove(className); // 移除class属性
    } else {
      view.dom.setAttribute('data-placeholder', text);
      view.dom.classList.add(className); // 添加class属性
    }
  };

  return new Plugin({
    props: {
        className: className
    },
    view(view) {
      update(view);

      return { update };
    }
  });
}