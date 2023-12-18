## Convert MOV to MP4

```
ffmpeg -i IMG_6753.MOV -vcodec libx264 -crf 23 -preset fast -acodec aac -b:a 128k -movflags +faststart output.mp4
```
