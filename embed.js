(function(){
  const script=document.currentScript
  const container=document.createElement('div')
  container.style.width='100%'
  container.style.height='100%'
  container.innerHTML=`<iframe src="${script.dataset.src}" style="width:100%;height:100%;border:0;"></iframe>`
  script.parentNode.replaceChild(container,script)
})()
