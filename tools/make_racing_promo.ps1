param(
  [string]$InputVideo = "C:\Users\LENOVO T14\Downloads\Promotional video (1).mp4",
  [string]$OutputVideo = "C:\Users\LENOVO T14\Desktop\protutorshub-app\dist\pro-tutors-hub-racing-promo.mp4"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$work = Join-Path $root ".tmp\racing-promo"
New-Item -ItemType Directory -Force -Path $work | Out-Null

$voiceWav = Join-Path $work "voiceover.wav"
$musicWav = Join-Path $work "music.wav"
$sfxWav = Join-Path $work "sfx.wav"
$mixWav = Join-Path $work "mix.wav"
$subsAss = Join-Path $work "captions.ass"
$mainMp4 = Join-Path $work "main_captioned.mp4"
$outroMp4 = Join-Path $work "outro.mp4"
$concatList = Join-Path $work "concat.txt"
$logo = Join-Path $root "public\logo.png"
$font = "C\:/Windows/Fonts/arialbd.ttf"
$inputEsc = $InputVideo.Replace("\", "/").Replace(":", "\:")
$logoEsc = $logo.Replace("\", "/").Replace(":", "\:")
$subsEsc = $subsAss.Replace("\", "/").Replace(":", "\:")

$script = @"
What if every Mathematics question made you faster?

Welcome to Pro Tutors Hub Racing.

Where every correct answer fuels your speed.

Every decision matters.

And every race builds confidence.

Challenge intelligent AI racers.

Unlock exciting leagues.

Improve your accuracy.

Think faster.

Race smarter.

Master Common Entrance Mathematics while having fun.

Play.

Learn.

Compete.

Excel.

Pro Tutors Hub.

The future of gamified learning.
"@

$voiceCreated = $false
try {
  Add-Type -AssemblyName System.Speech
  $speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $voice = $speaker.GetInstalledVoices() |
    Where-Object { $_.VoiceInfo.Gender -eq "Female" } |
    Select-Object -First 1
  if ($voice) {
    try {
      $speaker.SelectVoice($voice.VoiceInfo.Name)
    } catch {
      Write-Warning "Could not select $($voice.VoiceInfo.Name). Falling back to the default Windows voice."
    }
  }
  $speaker.Rate = 1
  $speaker.Volume = 100
  $speaker.SetOutputToWaveFile($voiceWav)
  $speaker.Speak($script)
  $speaker.SetOutputToNull()
  $speaker.Dispose()
  $voiceCreated = $true
} catch {
  Write-Warning "Windows text-to-speech is unavailable in this session. Rendering with captions, music, and SFX only."
  try {
    if ($speaker) {
      $speaker.SetOutputToNull()
      $speaker.Dispose()
    }
  } catch {}
  $voiceWav = Join-Path $work "voiceover_silent.wav"
  ffmpeg -y -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 -t 54 "$voiceWav"
}

$ass = @'
[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Big,Arial,72,&H00FFF7C2,&H000000FF,&H0035145F,&HAA000000,-1,0,0,0,100,100,0,0,1,5,2,2,90,90,86,1
Style: Mid,Arial,58,&H00FFFFFF,&H000000FF,&H0035145F,&H99000000,-1,0,0,0,100,100,0,0,1,4,2,2,90,90,92,1
Style: Punch,Arial,92,&H0038D9FF,&H000000FF,&H0035145F,&HAA000000,-1,0,0,0,100,100,0,0,1,6,3,5,80,80,80,1
Style: Gold,Arial,76,&H003FC7F5,&H000000FF,&H0035145F,&HAA000000,-1,0,0,0,100,100,0,0,1,5,2,2,90,90,88,1
Style: Close,Arial,54,&H00FFFFFF,&H000000FF,&H0035145F,&HAA000000,-1,0,0,0,100,100,0,0,1,4,2,2,90,90,90,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.20,0:00:03.40,Big,,0,0,0,,{\fad(180,180)\t(0,280,\fscx108\fscy108)}Who says learning Mathematics has to be boring?
Dialogue: 0,0:00:03.55,0:00:06.35,Mid,,0,0,0,,{\fad(150,150)}Race against intelligent AI opponents
Dialogue: 0,0:00:06.50,0:00:08.60,Punch,,0,0,0,,{\fad(90,130)\t(0,220,\fscx118\fscy118)}3... 2... 1... GO!
Dialogue: 0,0:00:08.70,0:00:12.10,Mid,,0,0,0,,{\fad(150,150)}Every correct answer makes you faster
Dialogue: 0,0:00:12.20,0:00:13.30,Punch,,0,0,0,,{\fad(80,90)\t(0,220,\fscx125\fscy125)}BOOST!
Dialogue: 0,0:00:13.50,0:00:16.50,Mid,,0,0,0,,{\fad(150,150)}Wrong answers slow you down
Dialogue: 0,0:00:16.70,0:00:18.30,Gold,,0,0,0,,{\fad(120,120)}Perfect Answer!
Dialogue: 0,0:00:18.60,0:00:22.00,Mid,,0,0,0,,{\fad(150,150)}Beat Flash.
Dialogue: 0,0:00:22.20,0:00:25.10,Mid,,0,0,0,,{\fad(150,150)}Outrun Speedster.
Dialogue: 0,0:00:25.30,0:00:27.80,Punch,,0,0,0,,{\fad(120,120)}You're Taking the Lead!
Dialogue: 0,0:00:28.00,0:00:31.50,Mid,,0,0,0,,{\fad(150,150)}Unlock new leagues.
Dialogue: 0,0:00:31.70,0:00:34.40,Mid,,0,0,0,,{\fad(150,150)}Earn achievements.
Dialogue: 0,0:00:34.70,0:00:37.40,Gold,,0,0,0,,{\fad(140,140)}Flash Is Catching Up!
Dialogue: 0,0:00:37.60,0:00:41.50,Mid,,0,0,0,,{\fad(150,150)}Master Common Entrance Mathematics.
Dialogue: 0,0:00:41.70,0:00:44.30,Punch,,0,0,0,,{\fad(100,120)\t(0,260,\fscx122\fscy122)}Final Sprint!
Dialogue: 0,0:00:44.50,0:00:48.60,Big,,0,0,0,,{\fad(160,180)}Can You Become The Champion?
'@
Set-Content -LiteralPath $subsAss -Value $ass -Encoding UTF8

$videoFilter = @"
[0:v]trim=start=0:end=6,setpts=(PTS-STARTPTS)/1.06,scale=2048:1152,crop=1920:1080:64:36,setsar=1[v0];
[0:v]trim=start=12:end=19,setpts=(PTS-STARTPTS)/1.12,scale=2160:1215,crop=1920:1080:120:68,setsar=1[v1];
[0:v]trim=start=24:end=31,setpts=(PTS-STARTPTS)/1.16,scale=2112:1188,crop=1920:1080:96:54,setsar=1[v2];
[0:v]trim=start=37:end=44,setpts=(PTS-STARTPTS)/1.14,scale=2064:1161,crop=1920:1080:72:40,setsar=1[v3];
[0:v]trim=start=51:end=58,setpts=(PTS-STARTPTS)/1.16,scale=2160:1215,crop=1920:1080:160:90,setsar=1[v4];
[0:v]trim=start=68:end=76,setpts=(PTS-STARTPTS)/1.18,scale=2112:1188,crop=1920:1080:96:54,setsar=1[v5];
[0:v]trim=start=89:end=101,setpts=(PTS-STARTPTS)/1.22,scale=2176:1224,crop=1920:1080:128:72,setsar=1[v6];
[v0][v1][v2][v3][v4][v5][v6]concat=n=7:v=1:a=0,trim=duration=49,setpts=PTS-STARTPTS,fps=30,format=yuv420p,
eq=contrast=1.11:saturation=1.22:brightness=0.015,
unsharp=5:5:0.55,
drawbox=x=0:y=0:w=iw:h=92:color=black@0.34:t=fill,
drawbox=x=0:y=ih-128:w=iw:h=128:color=black@0.36:t=fill,
drawtext=fontfile='$font':text='PRO TUTORS HUB RACING':x=58:y=32:fontsize=34:fontcolor=white:box=1:boxcolor=0x35145fAA:boxborderw=16,
subtitles='$subsEsc'[v]
"@
ffmpeg -y -i "$InputVideo" -filter_complex $videoFilter -map "[v]" -an -c:v libx264 -preset medium -crf 20 -movflags +faststart "$mainMp4"

$outroFilter = @"
color=c=0x35145f:s=1920x1080:d=5[base];
movie='$logoEsc',scale=360:-1[logo];
[base][logo]overlay=(W-w)/2:145,
drawtext=fontfile='$font':text='🏎 Play.   📚 Learn.   🏆 Compete.   🚀 Excel.':x=(w-text_w)/2:y=540:fontsize=58:fontcolor=0xfff7c2:borderw=3:bordercolor=0x16072a,
drawtext=fontfile='$font':text='Pro Tutors Hub':x=(w-text_w)/2:y=650:fontsize=78:fontcolor=white:borderw=4:bordercolor=0x16072a,
drawtext=fontfile='$font':text='The Future of Gamified Learning':x=(w-text_w)/2:y=745:fontsize=46:fontcolor=0xfff7c2:borderw=3:bordercolor=0x16072a,
drawtext=fontfile='$font':text='math.protutorshub.com':x=(w-text_w)/2:y=825:fontsize=40:fontcolor=0x38d9ff:borderw=3:bordercolor=0x16072a,
format=yuv420p[v]
"@
ffmpeg -y -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 -filter_complex $outroFilter -map "[v]" -map 0:a -t 5 -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 128k "$outroMp4"

@"
file '$($mainMp4.Replace("'", "''"))'
file '$($outroMp4.Replace("'", "''"))'
"@ | Set-Content -LiteralPath $concatList -Encoding ASCII

$musicFilter = @"
sine=frequency=55:sample_rate=48000:duration=54[bass];
sine=frequency=110:sample_rate=48000:duration=54[sub];
sine=frequency=440:sample_rate=48000:duration=54[lead1];
sine=frequency=660:sample_rate=48000:duration=54[lead2];
anoisesrc=color=pink:sample_rate=48000:duration=54[noise];
[bass]volume=0.18,atrim=0:54[bassv];
[sub]volume=0.10,atrim=0:54[subv];
[lead1]volume=0.045,tremolo=f=7:d=0.65,atrim=0:54[l1];
[lead2]volume=0.035,tremolo=f=11:d=0.50,atrim=0:54[l2];
[noise]highpass=f=5000,volume=0.025,atrim=0:54[nv];
[bassv][subv][l1][l2][nv]amix=inputs=5:normalize=0,
afade=t=in:st=0:d=1.5,afade=t=out:st=52:d=2,
acompressor=threshold=-18dB:ratio=2.5:attack=20:release=180
"@
ffmpeg -y -filter_complex $musicFilter -t 54 "$musicWav"

$sfxFilter = @"
sine=frequency=350:duration=0.18:sample_rate=48000,volume=0.14,adelay=6000|6000[b1];
sine=frequency=460:duration=0.18:sample_rate=48000,volume=0.14,adelay=6500|6500[b2];
sine=frequency=620:duration=0.18:sample_rate=48000,volume=0.14,adelay=7000|7000[b3];
sine=frequency=900:duration=0.45:sample_rate=48000,volume=0.18,adelay=7600|7600[go];
anoisesrc=color=white:sample_rate=48000:duration=1.1,highpass=f=1200,lowpass=f=8500,volume=0.12,afade=t=in:st=0:d=0.08,afade=t=out:st=0.82:d=0.28,adelay=12100|12100[boost1];
anoisesrc=color=white:sample_rate=48000:duration=0.55,highpass=f=2400,volume=0.07,adelay=16700|16700[reward];
sine=frequency=180:duration=0.7:sample_rate=48000,volume=0.08,afade=t=out:st=0.45:d=0.25,adelay=13500|13500[wrong];
anoisesrc=color=white:sample_rate=48000:duration=1.0,highpass=f=1500,volume=0.11,afade=t=out:st=0.72:d=0.28,adelay=25800|25800[lead];
sine=frequency=760:duration=0.5:sample_rate=48000,volume=0.11,adelay=34700|34700[pos];
anoisesrc=color=white:sample_rate=48000:duration=1.5,highpass=f=1100,volume=0.15,afade=t=out:st=1.05:d=0.45,adelay=41700|41700[sprint];
sine=frequency=880:duration=0.18:sample_rate=48000,volume=0.12,adelay=49800|49800[cele1];
sine=frequency=1170:duration=0.2:sample_rate=48000,volume=0.12,adelay=50150|50150[cele2];
[b1][b2][b3][go][boost1][reward][wrong][lead][pos][sprint][cele1][cele2]amix=inputs=12:normalize=0
"@
ffmpeg -y -filter_complex $sfxFilter -t 54 "$sfxWav"

ffmpeg -y -i "$voiceWav" -i "$musicWav" -i "$sfxWav" -filter_complex "[0:a]volume=1.35,adelay=600|600[vo];[1:a]volume=0.34[music];[2:a]volume=0.85[sfx];[music][sfx][vo]amix=inputs=3:duration=longest:normalize=0,acompressor=threshold=-16dB:ratio=3:attack=10:release=200,alimiter=limit=0.95[a]" -map "[a]" -t 54 "$mixWav"

ffmpeg -y -i "$mainMp4" -i "$outroMp4" -i "$mixWav" -filter_complex "[0:v]setpts=PTS-STARTPTS[v0];[1:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0[v]" -map "[v]" -map 2:a -c:v libx264 -preset medium -crf 19 -c:a aac -b:a 192k -shortest -movflags +faststart "$OutputVideo"

Write-Host "Created $OutputVideo"
