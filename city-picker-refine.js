/* 旅伴旅行管家｜城市选择兼容层
 * 暂停覆盖新建行程原生城市选择，避免与 new-trip-form-v2 的日期、城市状态和弹窗事件冲突。
 * 城市选择由 new-trip-form-v2.js 统一处理，保留原有数据结构与创建逻辑。
 */
(function(){
  'use strict';
  // Intentionally no DOM interception here.
  // This file remains as a compatibility placeholder so旧部署缓存不会继续执行旧的城市选择覆盖逻辑。
})();
