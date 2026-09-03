# Run Doc — MyNilam Frontend Preview

## How to reproduce uncommitted artifacts
- Copy `.env.dev` from main checkout if missing (it already exists in the workspace)
- Run `pnpm install` from the project root if `node_modules` is missing

## How to run the server
From `apps/web`, start Next.js dev server detached on Windows:

```
powershell -NoProfile -Command "Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory 'C:\Users\aanan\Desktop\AANAND AB\WORK\mynilam\apps\web' -RedirectStandardOutput 'C:\Users\aanan\Desktop\AANAND AB\WORK\mynilam\.freebuff\preview-43d3f638-143a-445b-ba4a-68471b2ba909.log' -RedirectStandardError 'C:\Users\aanan\Desktop\AANAND AB\WORK\mynilam\.freebuff\preview-43d3f638-143a-445b-ba4a-68471b2ba909.log.err' -WindowStyle Hidden -PassThru"
```

Next.js picks a random port (not 3000). Check the log for the actual URL:
```
powershell -NoProfile -Command "Get-Content 'C:\Users\aanan\Desktop\AANAND AB\WORK\mynilam\.freebuff\preview-43d3f638-143a-445b-ba4a-68471b2ba909.log' -Tail 5"
```

Look for `Local: http://localhost:<port>` in the output, then wait ~10s for the first compile and verify:
```
powershell -NoProfile -Command "Invoke-WebRequest -Uri http://localhost:<port> -UseBasicParsing -TimeoutSec 15 | Select-Object -ExpandProperty StatusCode"
```

Then register the preview with that URL and the pid from the Start-Process output.
