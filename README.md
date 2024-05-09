# 《饿殍：明末千里行》脚本播放器 The Hungry Lamb Script Web Player

## Demo

[《穗的梦》邂逅 ](https://zzzzzzzskyward.github.io/TheHungryLambWebPlayer/?command=play&file=works/dream/%E7%A9%97%E7%9A%84%E6%A2%A6.json)

[《假如满穗加入了闯军》莫莫莫里哀 ](https://zzzzzzzskyward.github.io/TheHungryLambWebPlayer/?command=play&file=works/cj/cj.json)

## 文档

见 [cmd.txt](tools/cmd.txt)

## 工具

`tools/csv2json.py`把Excel、WPS等表格程序导出的`csv`文件转换为`json`文件

## 部署方式

### 1. 本地部署

1. 克隆该仓库
2. 打开index.html
3. 在根目录下编辑你的脚本资源

### 2. 本地部署（服务器）

1. 克隆该仓库
2. 在根目录下开启服务器，例如
   - python -m http.server
   - python django模块
   - python socket模块
   - openresty
   - npm
3. 在works下编辑你的脚本资源，且通过`?command=play&file={works/文件夹名/文件名.json}`来观看

### 3. github部署

1. 提交一个issue，附上文件
2. 我处理后添加到仓库里

### 官方资源路径

个人脚本不允许出现这些关键词，一旦出现就会被认为是引用官方资源，从而只加载官方资源。

#### 	图片资源

​	Texture2D

#### 	视频资源

​	video

#### 	语音资源

​	AudioClip