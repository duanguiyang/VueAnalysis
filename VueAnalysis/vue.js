class Vue{
    constructor(options){// options接收的对象包含:$el节点 data数据 生命周期 计算属性等api

        this.$options = options
        this.$watchEvent = {} //将data中的数据存储到对象里，

        //生命周期函数的调用  调用顺序底层定义好，并且也写好data与el的获取顺序
        if(typeof options.beforeCreate == 'function'){
            options.beforeCreate.bind(this)()
        }
        this.$data = options.data  //获取data数据
        this.proxyData()
        this.observe()
        if(typeof options.created == 'function'){
            options.created.bind(this)()
        }

        if(typeof options.beforeMount == 'function'){
            options.beforeMount.bind(this)()
        }

        this.$el = document.querySelector(options.el) //获取根节点
        this.compile(this.$el) //执行compile函数进行模板解析 找到文本节点后将绑定的数据替换

        if(typeof options.mounted == 'function'){
            options.mounted.bind(this)()
        }


    }
    //data劫持  使用Object.defineProperty() 进行数据劫持
    proxyData(){
       for(let key in this.$data){
        Object.defineProperty(this,key,{
            get(){
                return this.$data[key]
            },
            set(val){
                this.$data[key] = val    
            }
        })
       } 
    }
    //触发data中的数据发生变化来执行watcher里的update
    observe(){
        //劫持data  拿到value值
        for(let key in this.$data){
            let value = this.$data[key]
            let that = this;
            Object.defineProperty(this.$data,key,{
                get(){
                    return value
                },
                set(val){
                    value = val
                    if(that.$watchEvent[key]){
                        that.$watchEvent[key].forEach((item,index)=>{
                            item.update()
                        })
                    }
                }   
            })
        }
    }

    compile(node){
        node.childNodes.forEach((item,index)=>{
            //判断节点类型：1是元素节点  3是文本节点
            if(item.nodeType == 3){ 
                //文本节点 如果有{{}} 就将节点赋值 
                let res = /\{\{(.*?)\}\}/g //正则匹配
                item.textContent = item.textContent.replace(res,(match,vmKey)=>{
                    vmKey=vmKey.trim()  //vmKey就是节点里的文本内容
                    if(this.hasOwnProperty(vmKey)){ //data中有数据 存到watchEvent对象里
                        let watch = new Watcher(this,vmKey,item,'textContent')
                        if(this.$watchEvent[vmKey]){
                            this.$watchEvent[vmKey].push(watch)
                        }else{ //第二次 先清空
                            this.$watchEvent[vmKey] = []
                            this.$watchEvent[vmKey].push(watch)
                        }

                    }
                    return this.$data[vmKey]
                })
            }

            if(item.nodeType == 1){ //元素节点

                //判断元素节点是否有绑定的事件属性 @click，有的话添加对应的事件
                if(item.hasAttribute('@click')){
                    console.log(this.$options);
                    item.addEventListener('click',(event)=>{
                        //获取节点绑定的属性名item.getAttribute("@click")
                       this.evenFn = this.$options.methods[item.getAttribute("@click").trim()].bind(this)
                       this.evenFn(event) //传递事件对象
                    })
                    //keyUp keyDown 同样的操作
                }
                //v-model
                if(item.hasAttribute("v-model")){
                    let vmodel = item.getAttribute("v-model").trim()
                    if(this.hasOwnProperty(vmodel)){
                        item.value = this.$data[vmodel]
                        item.addEventListener("input",(event)=>{
                            this[vmodel] = item.value
                            //这边直接赋值，因为之前已经将data里的属性劫持了，也就是proxyData
                            //通过Observe 劫持数据的变动，将input的数据赋值到劫持的对象上，视图层就跟着更新了
                        })

                    }
                }

                if(item.childNodes.length>0){
                    this.compile(item)
                }
                
            }
        })
    }
}


class Watcher{
    constructor(vm,key,node,attr){
        this.vm = vm;
        this.key = key;
        this.node = node;
        this.attr = attr
    }
    //执行改变update操作
    update() {
      this.node[this.attr] = this.vm[this.key]   //找到修改后的值
    }
}