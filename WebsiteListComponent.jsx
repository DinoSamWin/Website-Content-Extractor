import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable'; // 需要先安装: npm install react-draggable

// 假设您有类似这样的状态管理
const [expandedSites, setExpandedSites] = useState({});  // 或其他存储展开状态的方式

// 在添加操作的函数中
const handleAddContent = (selectedText) => {
    // 保存当前展开状态
    const currentExpandedState = {...expandedSites};
    
    // 执行添加操作
    // ... 添加内容的代码 ...
    
    // 确保展开状态不变
    setExpandedSites(currentExpandedState);
} 

const WebsiteListComponent = ({ websites, records }) => {
  // 存储每个网站的展开/折叠状态
  const [expandedSites, setExpandedSites] = useState({});
  
  // 用于记录弹窗位置的ref
  const nodeRef = useRef(null);
  
  // 用于控制点击的标志
  const clickTimeoutRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // 防止首次点击时位置闪动
  const handleStart = (e, data) => {
    isDraggingRef.current = true;
    
    // 清除任何现有的点击超时
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  };
  
  const handleStop = (e, data) => {
    // 短暂延迟重置拖动状态，避免与点击事件冲突
    clickTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
      clickTimeoutRef.current = null;
    }, 10);
  };
  
  // 清理副作用
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
  
  // 切换网站的展开/折叠状态
  const toggleExpand = (siteId, e) => {
    // 如果正在拖动，不处理点击事件
    if (isDraggingRef.current) return;
    
    // 阻止事件冒泡
    e.stopPropagation();
    
    setExpandedSites(prev => ({
      ...prev,
      [siteId]: !prev[siteId]
    }));
  };
  
  // 处理添加内容的操作
  const handleAddContent = (selectedText) => {
    if (!selectedText) return;
    
    // 保存当前展开状态，确保添加操作不会改变展开状态
    const currentExpandedState = {...expandedSites};
    
    // 执行添加操作
    console.log('添加内容:', selectedText);
    // ... 添加内容的代码 ...
    
    // 确保展开状态不变
    setExpandedSites(currentExpandedState);
  };
  
  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".popup-header"
      defaultPosition={{x: 100, y: 100}}
      bounds="body"
      scale={1}
      onStart={handleStart}
      onStop={handleStop}
    >
      <div 
        ref={nodeRef}
        className="website-popup" 
        style={{
          position: 'absolute',
          width: '300px',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 1000,
          userSelect: 'none'
        }}
      >
        <div 
          className="popup-header" 
          style={{
            padding: '10px',
            backgroundColor: '#f0f0f0',
            borderBottom: '1px solid #ddd',
            cursor: 'move',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px'
          }}
        >
          <span>网站列表</span>
        </div>
        
        <div className="popup-content" style={{padding: '10px'}}>
          <div className="website-list">
            {websites && websites.map(site => (
              <div key={site.id} className="website-item" style={{
                marginBottom: '8px'
              }}>
                <div 
                  className="website-header" 
                  onClick={(e) => toggleExpand(site.id, e)}
                  style={{ 
                    cursor: 'pointer',
                    padding: '5px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  {site.name}
                  <span className="expand-icon" style={{marginLeft: '5px'}}>
                    {expandedSites[site.id] ? '▼' : '►'}
                  </span>
                </div>
                
                {expandedSites[site.id] && (
                  <div className="website-records" style={{
                    padding: '5px',
                    paddingLeft: '15px',
                    backgroundColor: '#fff',
                    border: '1px solid #eee'
                  }}>
                    {records && records
                      .filter(record => record.siteId === site.id)
                      .map(record => (
                        <div key={record.id} className="record-item" style={{
                          padding: '3px 0'
                        }}>
                          {record.content}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => handleAddContent(window.getSelection().toString())}
            style={{ 
              margin: '10px 0',
              padding: '5px 10px',
              cursor: 'pointer' 
            }}
          >
            添加选中内容
          </button>
        </div>
      </div>
    </Draggable>
  );
};

export default WebsiteListComponent; 