/* 全国旅游数据库 · Excel 导入版 · 2026-08-12
   数据源：全国旅游数据库扩充版.xlsx
   统一字段：cities / spots / foods / hotels
   spots 额外保留 type/tags/rating/hours/duration/season/latlng/image，供智能推荐与导航使用。
*/
window.LVBAN_DATA="+json.dumps({"cities":cities,"spots":spots,"foods":foods,"hotels":hotels},ensure_ascii=False,separators=(',',':'))+";
