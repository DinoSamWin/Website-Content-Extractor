// 创建添加按钮元素
const addButton = document.createElement('div');
addButton.className = 'add-button';
addButton.textContent = '+';
addButton.style.display = 'none';
document.body.appendChild(addButton);

// 添加按钮点击事件
addButton.addEventListener('click', function() {
  const selectedText = this.dataset.text;
  const currentUrl = window.location.href;
  
  // 保存选中的内容
  chrome.storage.local.get(['savedContent'], function(result) {
    const savedContent = result.savedContent || {};
    if (!savedContent[currentUrl]) {
      savedContent[currentUrl] = [];
    }
    
    // 创建新的内容项
    const newItem = {
      id: Date.now().toString(),
      text: selectedText,
      timestamp: Date.now(),
      checked: false
    };
    
    savedContent[currentUrl].push(newItem);
    
    // 保存更新后的内容
    chrome.storage.local.set({savedContent: savedContent}, function() {
      if (chrome.runtime.lastError) {
        console.error('保存内容时出错:', chrome.runtime.lastError);
        return;
      }
      
      // 隐藏添加按钮
      addButton.style.display = 'none';
      
      // 创建或更新弹窗
      createPopupIframe();
    });
  });
});

// 监听文本选择事件
document.addEventListener('mouseup', function(e) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  // 如果有选中文本，显示添加按钮
  if (selectedText) {
    // 获取选中文本的位置
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // 设置添加按钮的位置（在选中文本的右上角）
    addButton.style.left = (rect.right + window.scrollX) + 'px';
    addButton.style.top = (rect.top + window.scrollY - 12) + 'px';
    addButton.style.display = 'block';
    
    // 保存当前选中的文本
    addButton.dataset.text = selectedText;
  } else {
    // 如果没有选中文本，隐藏添加按钮
    addButton.style.display = 'none';
  }
});

// 点击页面其他地方时隐藏添加按钮
document.addEventListener('mousedown', function(e) {
  // 如果点击的不是添加按钮，则隐藏它
  if (e.target !== addButton) {
    addButton.style.display = 'none';
  }
});

// 创建弹窗iframe
let popupIframe = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastX = 0;
let lastY = 0;
let animationFrameId = null;

// 创建弹窗
function createPopupIframe() {
  // 如果已经存在弹窗，则直接返回
  if (popupIframe) {
    popupIframe.style.display = 'block';
    return;
  }
  
  // 创建iframe元素
  popupIframe = document.createElement('iframe');
  // 使用chrome.runtime.getURL确保URL是扩展内部资源
  const iframeSrc = chrome.runtime.getURL('popup-iframe.html');
  popupIframe.src = iframeSrc;
  
  // 批量设置样式，减少重排和重绘
  const styles = {
    position: 'fixed',
    width: '300px',
    height: '400px',
    top: '50px',
    right: '20px',
    zIndex: '10000',
    border: 'none',
    borderRadius: '5px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    // 增强GPU加速以提高性能
    transform: 'translateZ(0)',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    perspective: '1000px',
    // 添加更多GPU加速相关属性
    transformStyle: 'preserve-3d',
    filter: 'blur(0)' // 触发GPU加速的小技巧
  };
  
  // 一次性应用所有样式，减少重排次数
  Object.assign(popupIframe.style, styles);
  document.body.appendChild(popupIframe);
  
  // 优化消息处理，使用事件委托减少事件监听器数量
  window.addEventListener('message', handleIframeMessages);
  
  // 拖拽移动 - 使用requestAnimationFrame优化性能
  document.addEventListener('mousemove', handleMouseMove);
  
  // 拖拽结束
  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  });
  
  // 等待iframe加载完成后再发送更新消息
  popupIframe.onload = function() {
    if (popupIframe && popupIframe.contentWindow) {
      try {
        const iframeSrc = chrome.runtime.getURL('popup-iframe.html');
        const iframeOrigin = new URL(iframeSrc).origin;
        popupIframe.contentWindow.postMessage('updateContent', iframeOrigin);
      } catch (err) {
        console.error('发送更新内容消息时出错:', err);
      }
    }
  };
}

// 处理来自iframe的消息 - 提取为单独函数以提高可维护性
function handleIframeMessages(event) {
  // 确保消息来源安全 - 只接受来自我们自己iframe的消息
  try {
    // 使用更宽松的检查方式，允许来自扩展的消息
    const iframeSrc = chrome.runtime.getURL('popup-iframe.html');
    const iframeOrigin = new URL(iframeSrc).origin;
    
    // 检查消息是否来自我们的iframe或者扩展本身
    if (popupIframe && (event.origin === iframeOrigin || event.origin.startsWith('chrome-extension://'))) {
      if (event.data === 'closePopup') {
        // 关闭弹窗
        if (popupIframe) {
          popupIframe.style.display = 'none';
        }
      } else if (event.data && event.data.type === 'dragStart') {
        // 接收来自iframe的拖拽开始消息
        isDragging = true;
        // 保存鼠标在iframe内的相对位置
        dragOffsetX = event.data.offsetX || 0;
        dragOffsetY = event.data.offsetY || 0;
        // 设置初始位置，避免第一帧的跳跃
        lastX = event.data.initialX || lastX;
        lastY = event.data.initialY || lastY;
        // 开始动画帧
        if (!animationFrameId) {
          // 立即请求动画帧，不直接调用函数
          animationFrameId = requestAnimationFrame(updatePopupPosition);
        }
      } else if (event.data && event.data.type === 'dragEnd') {
        // 接收来自iframe的拖拽结束消息
        isDragging = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else if (event.data === 'updateContent') {
        // iframe请求更新内容
        if (popupIframe && popupIframe.contentWindow) {
          try {
            popupIframe.contentWindow.postMessage('updateContent', iframeOrigin);
          } catch (err) {
            console.error('发送更新内容消息时出错:', err);
          }
        }
      }
    }
  } catch (error) {
    console.error('处理iframe消息时出错:', error);
  }
}

// 处理鼠标移动事件 - 只记录鼠标位置，不直接操作DOM
function handleMouseMove(e) {
  if (isDragging) {
    // 使用更高效的赋值方式
    lastX = e.clientX;
    lastY = e.clientY;
    // 防止拖拽时选中文本
    e.preventDefault();
  }
}

// 使用requestAnimationFrame更新弹窗位置，实现平滑动画
function updatePopupPosition() {
  if (isDragging && popupIframe) {
    // 计算新位置，避免在每一帧中重复计算
    const newLeft = lastX - dragOffsetX;
    const newTop = lastY - dragOffsetY;
    
    // 使用transform代替直接修改left/top属性，启用GPU加速
    // 使用translate3d强制GPU加速，提高性能
    popupIframe.style.transform = `translate3d(${newLeft}px, ${newTop}px, 0)`;
    
    // 只在拖拽开始时设置一次，避免每帧都修改样式属性
    if (popupIframe.style.right !== 'auto') {
      popupIframe.style.right = 'auto';
    }
  }
  
  // 如果仍在拖拽中，继续请求下一帧
  if (isDragging) {
    // 使用变量存储requestAnimationFrame的返回值，以便后续取消
    animationFrameId = requestAnimationFrame(updatePopupPosition);
  } else {
    animationFrameId = null;
  }
}

// 点击添加按钮时，保存选中的文本并显示弹窗
addButton.addEventListener('click', function() {
  const selectedText = this.dataset.text;
  if (selectedText) {
    // 获取当前网页URL
    const currentUrl = window.location.href;
    
    // 保存到Chrome存储
    saveContent(currentUrl, selectedText);
    
    // 隐藏添加按钮
    this.style.display = 'none';
    
    // 显示弹窗
    createPopupIframe();
  }
});

// 保存内容到Chrome存储
function saveContent(website, text) {
  // 提取域名作为主要标识符
  const urlObj = new URL(website);
  const domain = urlObj.hostname;
  
  chrome.storage.local.get(['savedContent'], function(result) {
    const savedContent = result.savedContent || {};
    
    // 查找是否已有该域名的网站
    let existingWebsite = null;
    for (const url in savedContent) {
      const urlDomain = new URL(url).hostname;
      if (urlDomain === domain) {
        existingWebsite = url;
        break;
      }
    }
    
    // 使用找到的网站URL或当前URL
    const targetWebsite = existingWebsite || website;
    
    // 如果该网站没有保存过内容，创建一个新数组
    if (!savedContent[targetWebsite]) {
      savedContent[targetWebsite] = [];
    }
    
    // 创建新内容项
    const newItem = {
      id: Date.now().toString(), // 使用时间戳作为唯一ID
      text: text,
      timestamp: Date.now(),
      checked: false
    };
    
    // 添加到该网站的内容数组中
    savedContent[targetWebsite].push(newItem);
    
    // 保存到Chrome存储
    chrome.storage.local.set({savedContent: savedContent}, function() {
      console.log('内容已保存');
      
      // 保存后立即通知弹窗更新内容
      if (popupIframe && popupIframe.contentWindow) {
        try {
          const iframeSrc = chrome.runtime.getURL('popup-iframe.html');
          const iframeOrigin = new URL(iframeSrc).origin;
          popupIframe.contentWindow.postMessage('updateContent', iframeOrigin);
        } catch (err) {
          console.error('发送更新内容消息时出错:', err);
        }
      }
    });
  });
}

// 监听来自popup的消息
window.addEventListener('message', function(event) {
  try {
    // 检查消息来源
    const iframeSrc = chrome.runtime.getURL('popup-iframe.html');
    const iframeOrigin = new URL(iframeSrc).origin;
    
    // 接受来自我们iframe的消息或者来自扩展内部的消息
    if ((event.origin === iframeOrigin || event.origin.includes('chrome-extension://')) && event.data === 'closePopup' && popupIframe) {
      console.log('收到关闭弹窗消息');
      popupIframe.style.display = 'none';
    }
  } catch (error) {
    console.error('处理关闭弹窗消息时出错:', error);
  }
});