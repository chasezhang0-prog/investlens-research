"""Download fixed public model artifacts, with normal TLS verification and bounded size."""
from pathlib import Path
import hashlib,json,sys,urllib.request
root=Path(__file__).resolve().parent
pinned=json.loads((root/'model-files.json').read_text())
name=sys.argv[1]
allowed=set(pinned['sha256'])|{'tensor-cache.json','mlc-chat-config.json','tokenizer.json','model-lib.wasm'}
if name not in allowed:raise SystemExit('Unknown model resource')
base='https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC/resolve/'+pinned['revision']+'/'
library='https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/Qwen3-0.6B-q4f16_1_cs1k-webgpu.wasm'
url=library if name=='model-lib.wasm' else base+name
expected=next((x['nbytes'] for x in pinned['files'] if x['dataPath']==name),None)
limit=expected or 25*1024*1024
directory=root/'.model-cache';directory.mkdir(exist_ok=True)
target=directory/name;temp=directory/(name+'.tmp')
size=0;digest=hashlib.sha256()
try:
 with urllib.request.urlopen(url,timeout=180) as response,temp.open('wb') as out:
  while True:
   data=response.read(1024*1024)
   if not data:break
   size+=len(data)
   if size>limit:raise ValueError('Model resource size exceeded')
   digest.update(data);out.write(data)
 if expected is not None and size!=expected:raise ValueError('Model resource was incomplete')
 if name in pinned['sha256'] and digest.hexdigest()!=pinned['sha256'][name]:raise ValueError('Model resource hash mismatch')
 temp.replace(target)
 print(json.dumps({'file':name,'bytes':size,'sha256':digest.hexdigest(),'source':'official model artifact','api_fee_cny':0}))
except Exception:
 temp.unlink(missing_ok=True)
 raise
