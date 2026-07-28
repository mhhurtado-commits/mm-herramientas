$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $PSScriptRoot 'equipos'
$competitionsDir = Join-Path $PSScriptRoot 'competencias'
$catalogPath = Join-Path $PSScriptRoot 'catalogo.json'
New-Item -ItemType Directory -Force -Path $teamsDir, $competitionsDir | Out-Null

$teams = @(
  @{ key='aldosivi'; name='Aldosivi' },
  @{ key='argentinos-juniors'; name='Argentinos Juniors' },
  @{ key='atletico-tucuman'; name='Atlético Tucumán' },
  @{ key='banfield'; name='Banfield' },
  @{ key='barracas-central'; name='Barracas Central' },
  @{ key='belgrano'; name='Belgrano' },
  @{ key='boca-juniors'; name='Boca Juniors' },
  @{ key='central-cordoba'; name='Central Córdoba' },
  @{ key='defensa-y-justicia'; name='Defensa y Justicia' },
  @{ key='deportivo-riestra'; name='Deportivo Riestra' },
  @{ key='estudiantes-rio-cuarto'; name='Estudiantes de Río Cuarto' },
  @{ key='estudiantes-lp'; name='Estudiantes de La Plata' },
  @{ key='gimnasia-mendoza'; name='Gimnasia y Esgrima de Mendoza' },
  @{ key='gimnasia-lp'; name='Gimnasia y Esgrima La Plata' },
  @{ key='huracan'; name='Huracán' },
  @{ key='independiente'; name='Independiente' },
  @{ key='independiente-rivadavia'; name='Independiente Rivadavia' },
  @{ key='instituto'; name='Instituto Córdoba' },
  @{ key='lanus'; name='Lanús' },
  @{ key='newells'; name="Newell's Old Boys" },
  @{ key='platense'; name='Platense' },
  @{ key='racing'; name='Racing Club' },
  @{ key='river-plate'; name='River Plate' },
  @{ key='rosario-central'; name='Rosario Central' },
  @{ key='san-lorenzo'; name='San Lorenzo' },
  @{ key='sarmiento'; name='Sarmiento de Junín' },
  @{ key='talleres'; name='Talleres' },
  @{ key='tigre'; name='Tigre' },
  @{ key='union'; name='Unión de Santa Fe' },
  @{ key='velez'; name='Vélez Sarsfield' },
  @{ key='nacional-uru'; name='Nacional de Uruguay' },
  @{ key='santos'; name='Santos Futebol Clube' },
  @{ key='universidad-central-venezuela'; name='Universidad Central de Venezuela' },
  @{ key='independiente-medellin'; name='Independiente Medellín' },
  @{ key='vasco-da-gama'; name='Vasco da Gama' },
  @{ key='bragantino'; name='RB Bragantino' },
  @{ key='sporting-cristal'; name='Sporting Cristal' },
  @{ key='cienciano'; name='Cienciano' },
  @{ key='gremio'; name='Grêmio' },
  @{ key='bolivar'; name='Bolívar' },
  @{ key='caracas'; name='Caracas FC' },
  @{ key='santa-fe'; name='Independiente Santa Fe' },
  @{ key='ohiggins'; name="O'Higgins" }
)

$competitions = @(
  @{ key='liga-profesional'; name='Liga Profesional Argentina' },
  @{ key='copa-sudamericana'; name='Copa Sudamericana' }
)

$headers = @{ 'User-Agent' = 'MediaMendozaVisualSuite/1.0 (editorial asset catalog)' }
$catalog = [ordered]@{
  version = 1
  actualizado = (Get-Date -Format 'yyyy-MM-dd')
  fuentes = [ordered]@{
    principal = 'https://commons.wikimedia.org/'
    referencia = 'https://www.footylogos.com/es/competition/liga-profesional'
  }
  equipos = [ordered]@{}
  competencias = [ordered]@{}
}

function Find-Logo($name) {
  $query = "intitle:logo OR intitle:escudo $name football"
  $url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=512&format=json&gsrsearch=' + [Uri]::EscapeDataString($query)
  $data = Invoke-RestMethod -Uri $url -Headers $headers
  if (-not $data.query.pages) { return $null }
  $pages = @($data.query.pages.PSObject.Properties.Value)
  $preferred = $pages | Where-Object { $_.title -match 'logo|escudo|crest|badge' } | Select-Object -First 1
  if (-not $preferred) { $preferred = $pages | Select-Object -First 1 }
  if (-not $preferred.imageinfo) { return $null }
  return [ordered]@{
    title = $preferred.title
    source = 'https://commons.wikimedia.org/wiki/' + [Uri]::EscapeDataString($preferred.title.Replace(' ', '_'))
    url = $preferred.imageinfo[0].thumburl
  }
}

foreach ($team in $teams) {
  try {
    $asset = Find-Logo $team.name
    if ($asset -and $asset.url) {
      $out = Join-Path $teamsDir ($team.key + '.png')
      Invoke-WebRequest -Uri $asset.url -Headers $headers -OutFile $out
      $catalog.equipos[$team.key] = [ordered]@{ nombre=$team.name; archivo='assets/futbol/equipos/' + $team.key + '.png'; fuente=$asset.source; estado='ok' }
      Write-Host ('OK  ' + $team.key)
    } else {
      $catalog.equipos[$team.key] = [ordered]@{ nombre=$team.name; archivo=$null; fuente=$null; estado='faltante' }
      Write-Warning ('FALTA  ' + $team.name)
    }
  } catch {
    $catalog.equipos[$team.key] = [ordered]@{ nombre=$team.name; archivo=$null; fuente=$null; estado='error'; detalle=$_.Exception.Message }
    Write-Warning ('ERROR  ' + $team.name + ': ' + $_.Exception.Message)
  }
  Start-Sleep -Milliseconds 250
}

foreach ($competition in $competitions) {
  try {
    $asset = Find-Logo $competition.name
    if ($asset -and $asset.url) {
      $out = Join-Path $competitionsDir ($competition.key + '.png')
      Invoke-WebRequest -Uri $asset.url -Headers $headers -OutFile $out
      $catalog.competencias[$competition.key] = [ordered]@{ nombre=$competition.name; archivo='assets/futbol/competencias/' + $competition.key + '.png'; fuente=$asset.source; estado='ok' }
      Write-Host ('OK  ' + $competition.key)
    } else {
      $catalog.competencias[$competition.key] = [ordered]@{ nombre=$competition.name; archivo=$null; fuente=$null; estado='faltante' }
      Write-Warning ('FALTA  ' + $competition.name)
    }
  } catch {
    $catalog.competencias[$competition.key] = [ordered]@{ nombre=$competition.name; archivo=$null; fuente=$null; estado='error'; detalle=$_.Exception.Message }
    Write-Warning ('ERROR  ' + $competition.name + ': ' + $_.Exception.Message)
  }
  Start-Sleep -Milliseconds 250
}

$catalog | ConvertTo-Json -Depth 8 | Set-Content -Path $catalogPath -Encoding UTF8
Write-Host ('Catálogo guardado: ' + $catalogPath)
