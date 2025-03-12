document.addEventListener('DOMContentLoaded', function() {
  // 从Chrome存储中加载保存的内容
  loadSavedContent();

  // 如果是在iframe中运行，添加关闭按钮事件和拖拽功能
  if (window.self !== window.top) {
    // 添加关闭按钮事件
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        try {
          // 使用ancestorOrigins获取父窗口的源，如果不可用则使用通配符
          const parentOrigin = window.location.ancestorOrigins ? 
            window.location.ancestorOrigins[0] : '*';
          window.parent.postMessage('closePopup', parentOrigin);
        } catch (error) {
          console.error('发送关闭弹窗消息时出错:', error);
        }
      });
    }
    
    // 添加拖拽功能
    const dragHandle = document.querySelector('.drag-handle');
    if (dragHandle) {
      let startX, startY;
      
      // 鼠标按下时开始拖拽
      dragHandle.addEventListener('mousedown', function(e) {
        startX = e.clientX;
        startY = e.clientY;
        
        try {
          const parentOrigin = window.location.ancestorOrigins ? 
            window.location.ancestorOrigins[0] : '*';
          window.parent.postMessage({
            type: 'dragStart',
            offsetX: startX,
            offsetY: startY
          }, parentOrigin);
        } catch (error) {
          console.error('发送拖拽开始消息时出错:', error);
        }
        
        // 防止拖拽时选中文本
        e.preventDefault();
      });
      
      // 鼠标释放时结束拖拽
      document.addEventListener('mouseup', function() {
        try {
          const parentOrigin = window.location.ancestorOrigins ? 
            window.location.ancestorOrigins[0] : '*';
          window.parent.postMessage({
            type: 'dragEnd'
          }, parentOrigin);
        } catch (error) {
          console.error('发送拖拽结束消息时出错:', error);
        }
      });
    }
  }
  
  // 监听来自父窗口的消息
  window.addEventListener('message', function(event) {
    // 增加安全检查，确保消息来源可信
    try {
      // 检查消息来源是否为父窗口
      if (window.parent === event.source) {
        if (event.data === 'updateContent') {
          // 收到更新内容的消息，重新加载内容
          loadSavedContent();
        }
      }
    } catch (error) {
      console.error('处理父窗口消息时出错:', error);
    }
  });
});

// 切换内容项的勾选状态
function toggleItemCheck(website, itemId) {
  chrome.storage.local.get(['savedContent'], function(result) {
    if (chrome.runtime.lastError) {
      console.error('获取存储数据时出错:', chrome.runtime.lastError);
      return;
    }

    const savedContent = result.savedContent || {};
    if (savedContent[website]) {
      const itemIndex = savedContent[website].findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        savedContent[website][itemIndex].checked = !savedContent[website][itemIndex].checked;
        
        chrome.storage.local.set({savedContent: savedContent}, function() {
          if (chrome.runtime.lastError) {
            console.error('保存数据时出错:', chrome.runtime.lastError);
            return;
          }
          loadSavedContent(); // 重新加载内容以更新显示
        });
      }
    }
  });
}

// 这里删除重复的toggleItemCheck函数定义

// 从Chrome存储中加载保存的内容
function loadSavedContent() {
  try {
    chrome.storage.local.get(['savedContent'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('获取存储数据时出错:', chrome.runtime.lastError);
        return;
      }
      const contentContainer = document.getElementById('content-container');
      contentContainer.innerHTML = '';
      
      if (result.savedContent && Object.keys(result.savedContent).length > 0) {
        // 按时间倒序排列网站
        const websites = Object.keys(result.savedContent).sort((a, b) => {
          const latestA = Math.max(...result.savedContent[a].map(item => item.timestamp));
          const latestB = Math.max(...result.savedContent[b].map(item => item.timestamp));
          return latestB - latestA;
        });
        
        // 为每个网站创建一个文件夹
        websites.forEach(website => {
          const websiteData = result.savedContent[website];
          if (websiteData.length > 0) {
            createWebsiteFolder(website, websiteData);
          }
        });
      } else {
        contentContainer.innerHTML = '<p style="text-align: center; color: #999;">暂无保存的内容</p>';
      }
    });
  } catch (error) {
    console.error('加载保存内容时出错:', error);
  }
}

// 创建网站文件夹
async function createWebsiteFolder(website, websiteData) {
  const contentContainer = document.getElementById('content-container');
  const websiteFolder = document.createElement('div');
  websiteFolder.className = 'website-folder';
  websiteFolder.dataset.website = website;

  // 提取域名作为网站标题
  const urlObj = new URL(website);
  const domain = urlObj.hostname;

  // 创建网站标题栏
  const websiteHeader = document.createElement('div');
  websiteHeader.className = 'website-header';

  // 网站图标
  const websiteIcon = document.createElement('img');
  websiteIcon.className = 'website-icon';
  websiteIcon.style.width = '20px';
  websiteIcon.style.height = '20px';
  websiteIcon.style.objectFit = 'contain';
  websiteIcon.style.borderRadius = '4px';

  // 尝试获取网站的favicon
  try {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    websiteIcon.src = faviconUrl;
  } catch (error) {
    console.error('获取favicon失败:', error);
    websiteIcon.src = 'images/icon16.png'; // 使用默认图标
  }

  // 网站名称
  const websiteName = document.createElement('div');
  websiteName.className = 'website-name';
  websiteName.textContent = domain;

  // 切换图标
  const toggleIcon = document.createElement('div');
  toggleIcon.className = 'toggle-icon';
  toggleIcon.innerHTML = '▶';

  // 添加点击事件以展开/收起内容
  websiteHeader.addEventListener('click', function() {
    const websiteContent = this.nextElementSibling;
    websiteContent.classList.toggle('open');
    toggleIcon.classList.toggle('open');
  });

  // 组装网站标题栏
  websiteHeader.appendChild(websiteIcon);
  websiteHeader.appendChild(websiteName);
  websiteHeader.appendChild(toggleIcon);

  // 创建网站内容区域
  const websiteContent = document.createElement('div');
  websiteContent.className = 'website-content';

  // 按时间倒序排列内容
  websiteData.sort((a, b) => b.timestamp - a.timestamp);
  
  // 为每个内容项创建元素
  websiteData.forEach(item => {
    const contentItem = document.createElement('div');
    contentItem.className = 'content-item';
    contentItem.dataset.id = item.id;
    
    // 勾选框
    const checkbox = document.createElement('div');
    checkbox.className = 'checkbox';
    checkbox.innerHTML = item.checked ? '✓' : '○';
    checkbox.style.color = item.checked ? '#808080' : '#FFFFFF';
    
    // 添加勾选事件
    checkbox.addEventListener('click', function(e) {
      e.stopPropagation();
      const checked = !item.checked;
      item.checked = checked;
      this.innerHTML = checked ? '✓' : '○';
      this.style.color = checked ? '#999' : '#333';
      contentText.classList.toggle('checked', checked);
      
      // 更新存储
      updateContentStatus(website, item.id, checked);
    });
    
    // 内容文本
    const contentText = document.createElement('div');
    contentText.className = 'content-text' + (item.checked ? ' checked' : '');
    contentText.textContent = item.text;
    
    // 删除按钮
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteContent(website, item.id, contentItem);
    });
    
    // 组装内容项
    contentItem.appendChild(checkbox);
    contentItem.appendChild(contentText);
    contentItem.appendChild(deleteBtn);
    
    websiteContent.appendChild(contentItem);
  });
  
  // 组装网站文件夹
  websiteFolder.appendChild(websiteHeader);
  websiteFolder.appendChild(websiteContent);
  
  contentContainer.appendChild(websiteFolder);
}

// 更新内容状态（勾选/取消勾选）
function updateContentStatus(website, id, checked) {
  chrome.storage.local.get(['savedContent'], function(result) {
    const savedContent = result.savedContent || {};
    
    if (savedContent[website]) {
      const itemIndex = savedContent[website].findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        savedContent[website][itemIndex].checked = checked;
        chrome.storage.local.set({savedContent: savedContent});
      }
    }
  });
}

// 这里删除重复的toggleItemCheck函数定义

// 删除内容
function deleteContent(website, id, contentItem) {
  chrome.storage.local.get(['savedContent'], function(result) {
    const savedContent = result.savedContent || {};
    
    if (savedContent[website]) {
      const itemIndex = savedContent[website].findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        savedContent[website].splice(itemIndex, 1);
        
        // 如果网站没有内容了，删除该网站
        if (savedContent[website].length === 0) {
          delete savedContent[website];
        }
        
        chrome.storage.local.set({savedContent: savedContent}, function() {
          // 从DOM中移除内容项
          contentItem.remove();
          
          // 如果网站没有内容了，移除整个网站文件夹
          const websiteContent = contentItem.parentElement;
          if (websiteContent && websiteContent.children.length === 0) {
            const websiteFolder = websiteContent.parentElement;
            if (websiteFolder) {
              websiteFolder.remove();
            }
          }
          
          // 不再调用loadSavedContent()，保持当前折叠状态
          
          // 如果没有内容了，显示提示信息
          if (Object.keys(savedContent).length === 0) {
            document.getElementById('content-container').innerHTML = 
              '<p style="text-align: center; color: #999;">暂无保存的内容</p>';
          }
        });
      }
    }
  });
}

// 这里删除重复的toggleItemCheck函数定义

// 已经在前面定义了消息监听器，这里删除重复的监听器