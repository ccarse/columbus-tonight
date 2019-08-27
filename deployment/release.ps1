function Invoke-Call {
  param (
      [scriptblock]$ScriptBlock
  )
  & @ScriptBlock
  if ($lastexitcode -ne 0) {
      exit $lastexitcode
  }
}

Invoke-Call -ScriptBlock { docker build --build-arg http_proxy="$env:abb_proxy" --build-arg https_proxy="$env:abb_proxy" -t ccarse.azurecr.io/columbus-tonight .. }
Invoke-Call -ScriptBlock { docker push ccarse.azurecr.io/columbus-tonight }
Invoke-Call -ScriptBlock { kubectl apply -f "./columbus-tonight.yml" }
Invoke-Call -ScriptBlock { kubectl set image deployment columbus-tonight-deployment columbus-tonight=$(docker inspect --format='{{index .RepoDigests 0}}' ccarse.azurecr.io/columbus-tonight:latest) }
