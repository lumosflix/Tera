const urlInput = document.getElementById('url-input');
const pwdInput = document.getElementById('pwd-input');
const fetchBtn = document.getElementById('fetch-btn');
const treeViewElement = document.getElementById('file-tree');

fetchBtn.onclick = async () => {
  const url = urlInput.value.trim();
  const pwd = pwdInput.value.trim();
  const shortUrl = url.match(/(?:surl=|\/)([a-zA-Z0-9-_]+)$/)[1];

  const info = await fetchInfo(shortUrl, pwd);
  const data = mapListToTree(info.list, info);
  TreeView(data, treeViewElement);
};

async function fetchInfo(shortUrl, pwd) {
  const res = await fetch(`/api/get-info-new?shorturl=${shortUrl}&pwd=${pwd}`);
  return res.json();
}

function mapListToTree(list, auth) {
  return list.map(item => ({
    name: item.filename,
    category: item.category,
    fs_id: item.fs_id,
    downloadAction: () => getDownload(auth, item.fs_id),
    downloadActionP: () => getDownloadP(auth, item.fs_id),
    children: item.children ? mapListToTree(item.children, auth) : null
  }));
}

async function getDownload({ shareid, uk, sign, timestamp }, fs_id) {
  const res = await fetch('/api/get-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shareid, uk, sign, timestamp, fs_id })
  });
  return res.json();
}

async function getDownloadP(auth, fs_id) {
  const res = await fetch('/api/get-downloadp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...auth, fs_id })
  });
  return res.json();
}

function TreeView(items, parent) {
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;

    const btn = document.createElement('button');
    btn.textContent = 'S1';
    btn.onclick = () => item.downloadAction();
    li.appendChild(btn);

    const btnP = document.createElement('button');
    btnP.textContent = 'S2';
    btnP.onclick = () => item.downloadActionP();
    li.appendChild(btnP);

    if (item.category === 1) {
      const playBtn = document.createElement('button');
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      playBtn.onclick = async () => {
        const { downloadLink } = await item.downloadActionP();
        const code = generateRandomString(11);
        saveToLocal({ name: item.name, code, url: downloadLink });
        window.open('', '_blank').location = '/w/' + code;
      };
      li.appendChild(playBtn);
    }

    parent.appendChild(li);
    if (item.children) {
      const ul = document.createElement('ul');
      TreeView(item.children, ul);
      parent.appendChild(ul);
    }
  });
}

function saveToLocal(entry) {
  const data = JSON.parse(localStorage.getItem('TeraBoxData') || '[]');
  data.unshift(entry);
  if (data.length > 10) data.pop();
  localStorage.setItem('TeraBoxData', JSON.stringify(data));
}

function generateRandomString(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < len; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
  return str;
}