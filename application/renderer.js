document.addEventListener('DOMContentLoaded', async () => {{
    // ページ読み込み時に適用
    applyMode(getCurrentMode());
    // ボタンがクリックされたときの動作 ダークモードの処理
    document.getElementById("toggle-mode").addEventListener("click", function () {
        const newMode = document.body.classList.contains("dark-mode") ? "light" : "dark";
        applyMode(newMode);
        console.log(newMode)
        localStorage.setItem("mode", newMode); // 設定を保存
        let element = document.getElementById("main_svg");
        if (element) {
            element.remove();
        }
        make_main_view(newMode);
    });

    const currentPath = document.getElementById('current-path');
    const path = await window.electronAPI.getSetting('path');
    currentPath.textContent = path || 'No value found';
    if (!path){
        window.electronAPI.createSettingWindow();
    }

    // `settingWindow` からの更新をリッスン
    window.electronAPI.onUpdatePath((key, value) => {
        let element = document.getElementById("main_svg");
        if (element) {
            element.remove();
        }
        currentPath.textContent = value; // メインウィンドウの要素を更新        
        make_main_view(getCurrentMode())
    });

    document.getElementById('setting-btn').addEventListener('click', async () => {
        await window.electronAPI.createSettingWindow();
    });

    document.getElementById('add-dir-btn').addEventListener('click', async () => {
        window.electronAPI.createAddDirectoryWindow();
    });
    make_main_view(getCurrentMode());
}});

function make_main_view(mode) {
    
    // メイン画面描画
    window.electronAPI.getDirectoryStructure().then((structure) => {
        
        const block_ids = Object.keys(structure);
        block_ids.forEach((block_id,i) => {
            structure = complete_structure(block_id, structure) 
        })

        // 各ノードを並べる順番を設定
        // レベルごとにノードを取得
        let max_level = Math.max(...Object.values(structure).map((block) => block["level"]));
        let nodes = {}
        let block_orders = [];
        let blocks_having_composition = [];
        for (let l = 0; l <= max_level; l++) {
            nodes[l] = Object.keys(structure).filter((block_id) => structure[block_id]["level"] === l)
            block_orders[l] = [];
            blocks_having_composition[l] = [];
        }

        // 各ノードのレベルごとの順番を生成
        // まず辞書順に並べたときに，一番上のブロックから処理していく．
        let order = 0;        
        nodes[0].map((block)=>structure[block]["id"]).sort((a,b) => a - b).forEach((block_id) => {
            let result = set_order(order, block_id, structure, block_orders, 0)
            order = result[0];
            structure = result[1];
            block_orders = result[2];
        })

        // level >= 1 では，その一つ前の level の並びをもとに，コンポジションされているノードから並べていく．
        for (let l = 1; l <= max_level; l++) {
            order = 0;
            block_orders[l-1].forEach((block_id) => {
                structure[block_id].composition.forEach((composition_id) => {
                    let result = set_order(order, composition_id, structure, block_orders, l)
                    order = result[0];
                    structure = result[1];
                    block_orders = result[2];
                })
            })
            nodes[l].map((block)=>structure[block]["id"]).sort((a,b) => a - b).forEach((block_id) => {
                let result = set_order(order, block_id, structure, block_orders, l)
                order = result[0];
                structure = result[1];
                block_orders = result[2];
            })        
        }

        // メイン画面描画
        const node_height = 16;
        const node_span = 60; 
        const level_width = 200;
        const node_add_height = 8;
        const level_add_width = 10; 
        const level_offset_y = 40;
        const offset_x = 50;
        const offset_y = 100;
        const text_x = 6;
        const text_y = 14;
        const text_size = 16;
        const nodeRadius = 8;
        let curveSize = 20;

        // 各ノードの座標を計算
        let y = offset_y;
        let x = offset_x - level_width;

        for (let l = 0; l <= max_level; l++) {
            y = offset_y*l;
            x = x + level_width + (l === 0 ? 0 : blocks_having_composition[l-1].length)*level_add_width;   
            console.log(x)
            block_orders[l].forEach((block_id, i) => {        
                y = y + node_height + Math.max(0,structure[block_id]["upper_ids"].length -1)*node_add_height + node_span; // todo ,  structure[block_id]["upper_ids"].length == 0, 1 はおなじ
                structure[block_id]["x"] = x;
                structure[block_id]["y"] = y; // ノードの下端の位置を設定
                if (structure[block_id]["composition"].length > 0) {
                    blocks_having_composition[l].push(block_id)
                }
            })       
        }

        let width = Math.max(...Object.values(structure).map((block) => block["x"])) + level_width + offset_x;  
        let height = Math.max(...Object.values(structure).map((block) => block["y"])) + node_span + offset_y; 

        let links = []
        // let level = 0
        let id = 0;
        let comp_id_in_level = 0;
        let path = [];

        for (let level = 0; level <= max_level; level++) {
            comp_id_in_level = 0;
            block_orders[level].forEach((block_id, i) => {
                structure[block_id]["composition"].forEach((composition_id) => {
                    let source_x = structure[block_id]["x"];
                    let source_y = structure[block_id]["y"] - node_height/2;                

                    if ("number_of_upper" in structure[composition_id]){                    
                        structure[composition_id]["number_of_upper"] += 1;
                    }else{
                        structure[composition_id]["number_of_upper"] = 0;
                    }

                    let target_x = structure[composition_id]["x"];
                    let target_y = structure[composition_id]["y"] - structure[composition_id]["number_of_upper"]*node_add_height - node_height/2;


                    let R = curveSize;
                    let d = Math.abs(target_y - source_y)/2;
                    let x_m = source_x + (level_width/2) +  (blocks_having_composition[level].length-(1+comp_id_in_level))*level_add_width;
                    let y_m = source_y + (target_y - source_y)/2;
                    let x_d = (2*R*d^2)/(R^2+d^2);
                    let y_d = d*(R^2-d^2)/(R^2+d^2);
                    let y_de = (R^2 - d^2)/(2*d)


                    path = d3.path();
                    if (target_y > source_y) {                
                        if (Math.abs(target_y - source_y) > 2*R) {
                            path.moveTo(source_x, source_y); // 出発点
                            path.lineTo(x_m - R, source_y); 
                            path.arcTo(x_m, source_y, x_m, source_y + R, R); 
                            path.lineTo(x_m, target_y - R); 
                            path.arcTo(x_m, target_y, x_m + R, target_y, R); 
                            path.lineTo(target_x, target_y);                     
                        } else {
                            // x_m = x_m + R/4;
                            path.moveTo(source_x, source_y); // 出発点
                            path.lineTo(x_m - R, source_y); 
                            path.quadraticCurveTo(x_m-R/5, source_y, x_m, y_m);
                            path.moveTo(target_x, target_y);
                            path.lineTo(x_m + R, target_y); 
                            path.quadraticCurveTo(x_m+R/5, target_y, x_m, y_m);  
                        }
                    } else {
                        if (Math.abs(target_y - source_y) > 2*R) {
                            path.moveTo(source_x, source_y); // 出発点
                            path.lineTo(x_m - R, source_y); 
                            path.arcTo(x_m, source_y, x_m, source_y - R, R); 
                            path.lineTo(x_m, target_y + R); 
                            path.arcTo(x_m, target_y, x_m + R, target_y, R); 
                            path.lineTo(target_x, target_y); 
                        } else {
                            // x_m = x_m + R/4;
                            path.moveTo(source_x, source_y); // 出発点
                            path.lineTo(x_m - R, source_y); 
                            path.quadraticCurveTo(x_m-R/5, source_y, x_m, y_m);
                            path.moveTo(target_x, target_y);
                            path.lineTo(x_m + R, target_y); 
                            path.quadraticCurveTo(x_m+R/5, target_y, x_m, y_m);  
                        }
                    }
                    links.push({
                        "source_id" : block_id,
                        "target_id" : composition_id,
                        "comp_id_in_level" : comp_id_in_level, 
                        "id" : id,
                        "level" : level, 
                        "path": path.toString()
                    });
                    id += 1;
                })        
                comp_id_in_level += 1;        
            })
        }

        let super_links = []
        Object.keys(structure).forEach((block_id) => {
            let super_id = structure[block_id]["super"];
            if (!(super_id === null)) {
                let source_x = structure[block_id]["x"];
                let source_y = structure[block_id]["y"] - Math.max(0,structure[block_id]["upper_ids"].length -1)*node_add_height - node_height;   
                let target_x = structure[super_id]["x"];
                let target_y = structure[super_id]["y"];

                path = d3.path();
                path.moveTo(source_x, source_y); // 出発点
                path.lineTo(target_x, target_y); // 出発点
                super_links.push({
                    "source_id" : block_id,
                    "target_id" : super_id,
                    "path": path.toString()
                });
            }
        })

        Object.keys(structure).forEach((block_id) => {
            let x = structure[block_id]["x"]
            let y = structure[block_id]["y"]
            let n_up = Math.max(0,structure[block_id]["upper_ids"].length -1);       

            let track_width = node_height + n_up*node_add_height; 
            let r = nodeRadius;
            let path = d3.path();
            path.moveTo(x - r, y - track_width + r);
            path.lineTo(x - r, y - r);
            path.arcTo(x - r, y, x, y, r);
            path.arcTo(x + r, y, x+r, y-r, r);
            path.lineTo(x + r, y - track_width + r);
            path.arcTo(x + r, y - track_width, x, y-track_width, r);
            path.arcTo(x - r, y - track_width, x - r, y - track_width + r, r); 
            structure[block_id]["node_path"] = path.toString() 
        }) 
        
        const data = Object.entries(structure)
        // 各ノードを作成．
        let svg = d3.select("#main_view").append("svg")
            .attr("id", "main_svg")
            .attr("width", width)
            .attr("height", height);

        // 縁取り
        svg.append("filter")
            .attr("id", "outline")
            .html(`
                <feMorphology operator="dilate" radius="0.8" in="SourceAlpha" result="outline"/>
                <feFlood flood-color=${(mode === "dark" ? "black" : "white")} result="color"/>
                <feComposite in="color" in2="outline" operator="atop" result="outlineColor"/>
                <feMerge>                
                <feMergeNode in="outlineColor"/>
                    <feMergeNode in="SourceGraphic"/>                
                </feMerge>
            `);
        
        // 直線矢印を定義
        svg.append("defs")
            .append("marker")
            .attr("id", "line-arrow")
            .attr("markerWidth", 10)  
            .attr("markerHeight", 10)
            .attr("refX", 10)  // 位置調整
            .attr("refY", 5)
            .attr("orient", "auto")
            .append("line")  // 矢印部分を線にする
            .attr("x1", 0)
            .attr("y1", 5)
            .attr("x2", 10)
            .attr("y2", 5)
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        svg.selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("d", function (d){return d.path})
            .attr("fill", "none")
            .attr("stroke", (mode === "dark" ? "white" : "black"))
            .attr("stroke-width", 1)
            .attr("class", "link")  
            // .attr("filter", "url(#outline)");    
            
        svg.selectAll(".super_link")
            .data(super_links)
            .enter()
            .append("path")
            .attr("d", function (d){return d.path})
            .attr("fill", "none")
            .attr("stroke", (mode === "dark" ? "white" : "black"))
            .attr("stroke-width", 1)
            .attr("class", "super_link")  
            .attr("stroke-dasharray", "3,1")   
            .attr("marker-end", "url(#arrow)"); 
        
        svg.selectAll('.node')
            .data(data)
            .enter()
            .append('path')
            .attr("d", d => d[1].node_path) // d3.path() のパスを適用
            .attr("fill", (mode === "dark" ? "black" : "white")) 
            .attr("stroke", (mode === "dark" ? "white" : "black")) // 線の色
            .attr("stroke-width", (mode === "dark" ? 1.2 : 1.8)) // 線の太さ
            .attr("class", "node") 
            .attr("filter", "url(#outline)")  
            .on("mouseover", (event, d) => highlightConnectedElements(d[1].id, true, svg, mode))
            .on("mouseout", (event, d) => highlightConnectedElements(d[1].id, false, svg, mode))   
            .on("contextmenu", (event, d) => {
                event.preventDefault(); // ブラウザのデフォルトメニューを無効化
                window.electronAPI.showContextMenu(
                    {nodeId: d[1].id, 
                    path: d[1].path, 
                });
            })
        svg.selectAll("text")
            .data(data)  // テキストデータ
            .enter()
            .append("text")
            .attr("x", (d, i) => d[1]["x"] + text_x) // X座標を等間隔で
            .attr("y", (d, i) => d[1]["y"] - text_y) // Y座標を固定
            .text(d => d[1]["id"])                      // テキストの中身
            .attr("font-size", `${text_size}px`)
            .attr("fill", (mode === "dark" ? "white" : "black"))  
            .attr("filter", "url(#outline)")
            .on("mouseover", (event, d) => highlightConnectedElements(d[1].id, true, svg, mode))
            .on("mouseout", (event, d) => highlightConnectedElements(d[1].id, false, svg, mode)) 
            
    });

    window.electronAPI.onMenuItemClicked((action) => {
        console.log("選択されたメニュー:", action);
        if (action === "Show properties") {
            // showProperties(d);
        }
    });
}

function showContextMenu(event, d) {
    // すでにメニューがあれば削除
    d3.select("#context-menu").remove();

    // メニュー用の `div` を作成
    let menu = d3.select("body")
        .append("div")
        .attr("id", "context-menu")
        .style("position", "absolute")
        .style("top", `${event.pageY}px`)
        .style("left", `${event.pageX}px`)
        .style("background", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("box-shadow", "2px 2px 5px rgba(0,0,0,0.3)")
        .style("z-index", "1000");

    // メニュー項目を追加
    let options = ["Show oroperties", "Reveal in Finder", "Edit"];
    options.forEach(option => {
        menu.append("div")
            .text(option)
            .style("padding", "5px")
            .style("cursor", "pointer")
            .on("click", () => {
                handleMenuClick(option, d);
                menu.remove(); // クリック後にメニューを消す
            });
    });

    // クリックしたらメニューを閉じる
    d3.select("body").on("click", () => menu.remove());
}

// ノードとテキストのホバー・クリック処理を共通化する関数
function highlightConnectedElements(nodeId, highlight, svg, mode) {
    let color = highlight ? (mode === "dark" ? "lightblue" : "blue") : (mode === "dark" ? "white" : "black");
    let fillColor = highlight ? "lightblue" : (mode === "dark" ? "black" : "white");
    let fillColor_ret = highlight ? (mode === "dark" ? "lightblue" : "blue") : (mode === "dark" ? "black" : "white");
    let strokeWidth = highlight ? 2 : 1;


    // ノードの色を変更
    svg.selectAll('.node')
        .filter(d => d[1]["id"] === nodeId)
        .attr("fill", fillColor);

    svg.selectAll('.node')
        .filter(d => d[1]["composition"].includes(nodeId) || d[1]["upper_ids"].includes(nodeId))
        .attr("fill", fillColor_ret);        

    // 関連するリンクの色を変更
    svg.selectAll(".link")
        .filter(link => link.source_id === nodeId || link.target_id === nodeId)
        .attr("stroke", color)
        .attr("stroke-width", strokeWidth);

    // 関連するテキストの色を変更
    svg.selectAll("text")
        .filter(d => d[1]["id"] === nodeId || d[1]["composition"].includes(nodeId) || d[1]["upper_ids"].includes(nodeId))
        .attr("fill", color);
}


function complete_structure(block_id, structure) {
    if (!("level" in structure[block_id])){
        // 継承に関する階層の処理　
        // block_id と，block_id が継承されている，もしくはしているブロックのidをまとめる
        let block_ids = get_super_connection_ids(block_id, structure)
        // block_ids を composition として設定している block (upper_id) の階層を取得        
        let upper_ids = get_upper_ids(block_ids, structure);    
        let supered_id = []
        Object.keys(structure).forEach((block_id_,i) => {
            if (structure[block_id_]["super"] === block_id){
                supered_id.push(block_id_)
            }
        })
        
        // 再帰的にblock_id の レベルを取得
        let upper_levels = [];   
        upper_ids.forEach((upper_id,i) => { 
            structure = complete_structure(upper_id, structure); 
            upper_levels.push(structure[upper_id]["level"]); 
        })       
        let level = 0;
        // block_ids を composition しているブロックがない場合，block_ids の階層は 0 
        if (upper_levels.length === 0 ){   
             level = 0                       
        } else {       
            // それ以外の場合は，composition しているブロックの中でもっとも階層が低いもの + 1 を block_id の compostiion 階層に設定    
            level = Math.max(...upper_levels) + 1
        }                    
        structure[block_id]["level"] = level
        structure[block_id]["super_connection_ids"] = block_ids;
        structure[block_id]['upper_ids'] = upper_ids;
        structure[block_id]['supered_id'] = supered_id;
    }   
    return structure
}

function get_upper_ids(search_block_ids, structure) {
    const block_ids = Object.keys(structure);
    let upper_ids = []
    block_ids.forEach((block_id, i) => {
        search_block_ids.forEach((search_block_id) => {
            if (structure[block_id]['composition'].includes(search_block_id)) {
                upper_ids.push(block_id)
            }            
        }) 
    })
    return upper_ids
}

// serch_block_id と継承関係でつながっているブロックをすべて取得
function get_super_connection_ids(search_block_id, structure) {
    let lower_connection_ids = get_lower_connection_ids(search_block_id, structure);
    let upper_connection_ids = []
    if (!(structure[search_block_id]["super"] === null)){
       upper_connection_ids = get_upper_connection_ids(structure[search_block_id]["super"], structure);
    }
    let super_connection_ids = [...lower_connection_ids, ...upper_connection_ids]
    return super_connection_ids
}

function get_lower_connection_ids(search_block_id,structure) {
    const block_ids = Object.keys(structure);
    let lower_ids = []
    block_ids.forEach((block_id, i) => {
        if (structure[block_id]["super"] === search_block_id) {
            lower_ids = get_lower_connection_ids(block_id, structure)
        }              
    })
    lower_ids.push(search_block_id)
    return lower_ids
}

function get_upper_connection_ids(search_block_id,structure) {
    const block_ids = Object.keys(structure);
    let upper_ids = []
    if (!(structure[search_block_id]["super"] === null)){
        upper_ids = get_upper_connection_ids(structure[search_block_id]["super"], structure)
    }
    upper_ids.push(search_block_id)
    return upper_ids
}


// 継承先がない場合は，そのままのorder, また，継承されている場合には，その継承元のブロックのorderを再帰的に設定．
function set_order(order, block_id, structure, block_orders, level) { 
    if ((!("order" in structure[block_id])) && structure[block_id]["level"] === level) { // すでに設定されている場合は飛ばす
        structure[block_id]["order"] = order;
        block_orders[level].push(block_id)
        order += 1;  

        if (structure[block_id]["supered_id"].length > 0) { // 継承されているブロックがある場合
            let result = set_order(order, structure[block_id]["supered_id"][0], structure, block_orders, level)
            order = result[0];
            structure = result[1];
            block_orders = result[2];
        }   
    }

    return [order, structure, block_orders]  
}

function detect_level_inds(block_id, level_inds, structure) {
    if (!(block_id in level_inds)) {
        // 継承に関する階層の処理
        // block_id と，block_id が継承されている，もしくはしているブロックのidをまとめる
        let block_ids = get_super_connection_ids(block_id, structure)
        // block_ids を composition として設定している block (upper_id) の階層を取得        
        let upper_ids = get_upper_ids(block_ids, structure);     
        
        let upper_pos_inds = [];   
        upper_ids.forEach((upper_id,i) => {                
            level_inds = detect_level_inds(upper_id, level_inds, structure); 
            upper_pos_inds.push(level_inds[upper_id]); 
        })       

        let level = 0;
        // block_ids を composition しているブロックがない場合，block_ids の階層は 0 
        if (upper_pos_inds.length === 0 ){   
             level = 0                       
        } else {       
            // それ以外の場合は，composition しているブロックの中でもっとも階層が低いもの + 1 を block_id の compostiion 階層に設定    
            level = Math.max(...upper_pos_inds) + 1
        }                    
        block_ids.forEach((block_id_,i) => {
            level_inds[block_id_] = level
        })       
    }   
    return level_inds
}

// デバイスの設定を読み込む関数
function detectSystemPreference() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// 現在のモードを取得する関数
function getCurrentMode() {
    return localStorage.getItem("mode") || detectSystemPreference();
}

// モードを適用する関数
function applyMode(mode) {
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');    
    if (mode === "dark") {
        document.body.classList.add("dark-mode");
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
        // document.getElementById("toggle-mode").textContent = "☀️"; // ライトモードアイコン
    } else {
        document.body.classList.remove("dark-mode");
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
        // document.getElementById("toggle-mode").textContent = "🌙"; // ダークモードアイコン
    }
}

function isDarkMode() {
    return document.body.classList.contains("dark-mode");
}


