import { Plugin } from 'prosemirror-state';

const hasContent = (doc) => {
  // 只要有非空段落或有非段落节点（如 imageContainer），就算有内容
  for (let i = 0; i < doc.childCount; i++) {
    const child = doc.child(i);
    if (child.type.name !== 'paragraph') return true;
    if (child.textContent && child.textContent.trim() !== '') return true;
  }
  return false;
};

export default function placeholder(text, className) {
  const update = (view) => {
    if (hasContent(view.state.doc)) {
      view.dom.removeAttribute('data-placeholder');
      view.dom.classList.remove(className);
    } else {
      view.dom.setAttribute('data-placeholder', text);
      view.dom.classList.add(className);
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