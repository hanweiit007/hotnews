// 时间格式化工具
function formatTime(date) {
  if (!date) return ''
  var d = new Date(date)
  var now = new Date()
  var diff = now - d
  var minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return minutes + '分钟前'
  
  var hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + '小时前'
  
  var days = Math.floor(hours / 24)
  if (days < 30) return days + '天前'
  
  return d.getFullYear() + '-' + 
         String(d.getMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getDate()).padStart(2, '0')
}

module.exports = {
  formatTime: formatTime
}