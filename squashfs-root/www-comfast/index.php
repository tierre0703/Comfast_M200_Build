<?php
require 'config.php';
if (!WF_Auth::isLogin()) {
    wf_redirect('login.html');
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
    <meta http-equiv="Expires" content="0">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Cache-control" content="no-cache">
    <meta http-equiv="Cache" content="no-cache">
    <title></title>
    <link rel="stylesheet" type="text/css" href="/css/bootstrap.min.css"/>
    <link rel="stylesheet" type="text/css" href="/fonts/allfonts.css"/>
    <link rel="stylesheet" type="text/css" href="/css/ora.css"/>
    <link rel="stylesheet" type="text/css" href="/css/theme.css"/>
    <link rel="stylesheet" type="text/css" href="/css/jPages.css"/>
    <link rel="stylesheet" href="static/css/style.css"/>
    <link rel="stylesheet" href="static/css/toolbar.css"/>
    <script type="text/javascript">
        window.nfs = {
            admin: <?php echo WF_Auth::isAdmin() ? 'true' : 'false';?>,
            host: '<?php echo wf_gpc('wf_uhost', 's');?>',
            path: '<?php echo wf_gpc('wf_upath', 's');?>'
        };
    </script>
    <!--[if lt IE 9]>
    <script src="/common/lib/respond.min.js"></script>
    <![endif]-->
    <style>
        #content-wrapper {
            margin-left: 0px;
        }
    </style>
</head>
<body module="clouds">
<div id="theme-wrapper">
    <!-- header start -->
    <div class="navbar" id="header-navbar">
        <div class="container-fluid">
            <a href="/index.html" id="logo" class="navbar-brand">
                <img src="/img/logo.png" alt="" class="normal-logo logo-white"/>
            </a>
            <div class="clearfix">
                <div class="nav-no-collapse pull-right" id="header-nav">
                    <ul class="nav navbar-nav pull-right">
                        <li class="hidden-xs">
                            <a href="/login.html">
                                <i class="fa fa-power-off" href="/login.html"></i>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <!-- header end -->

    <div id="page-wrapper" class="container-fluid">
        <div id="content-wrapper">
<!--            <div class="row">
                <div class="col-lg-6">
                    <div class="row">
                        <ol class="breadcrumb">
                            <li class="litile">
                                <span sh_lang="home_web"></span>
                                <span> > </span>
                                <span sh_lang="cloud"></span>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>-->
            <div class="row">
                <div class="col-lg-12" id="has_udisk">
                    <div class="main-box clearfix">
                        <div class="main-box-header clearfix cloud_head">
                            <div class="row" id="tools-bar">
                                <a class="btn btn-primary pull-left mrg-h-lg mrg-r-xs"
                                   href="javascript:app.nfs.upload();">
                                    <i class="fa fa-plus-circle fa-lg"></i>
                                    <span>上传</span>
                                </a>
                            </div>
                        </div>
                        <div class="main-box-body">
                            <div id="loading">
                                <img src="/img/scan_loading.gif" style="position: absolute; top: 45%">
                            </div>
                            <div id="list">
                                <div id="list_main">
                                    <div id="list_main_center">
                                        <table class="tree-browser" cellpadding="0" cellspacing="0">
                                            <tbody id="dirs-files-list">
                                            <th><font color="green">文件列表加载中...</font></th>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div class="clean"></div>
                                </div>
                            </div>

                            <div id="contextDirMenu"></div>
                            <div id="contextFileMenu"></div>

                            <script id="nlist-bar" type="text/template">
                                <div class="pull-left">
                                    <a class="btn btn-primary pull-left mrg-h-lg mrg-r-xs"
                                       href="javascript:app.nfs.upload();">
                                        <i class="fa fa-plus-circle fa-lg"></i>
                                        <span>上传</span>
                                    </a>
                                    <!--<a class="btn btn-primary pull-left mrg-h-lg mrg-r-xs" href="javascript:app.mui.SelectAll();">
                                        <i class="fa fa-plus-circle fa-lg"></i>
                                        <span>选择</span>
                                    </a>
                                    <a class="btn btn-primary pull-left mrg-h-lg mrg-r-xs" href="javascript:app.nfs.nlist(app.nfs.cpath, true);">
                                        <i class="fa fa-plus-circle fa-lg"></i>
                                        <span>刷新</span>
                                    </a>
                                    <a class="btn btn-primary pull-left mrg-h-lg mrg-r-xs" href="javascript:app.nfs.mkdir();">
                                        <i class="fa fa-trash-o fa-lg" ></i>
                                        <span>新建文件夹</span>
                                    </a>
                                    <a class="btn btn-primary pull-left mrg-h-lg mrg-r-xs" href="javascript:app.nfs.cut(false);">
                                        <i class="fa fa-trash-o fa-lg"></i>
                                        <span>剪切</span>
                                    </a>
                                    <a class="btn btn-primary pull-left mrg-h-lg mrg-r-xs" href="javascript:app.nfs.copy(false);">
                                        <i class="fa fa-trash-o fa-lg"></i>
                                        <span>复制</span>
                                    </a>
                                    <a class="btn btn-primary pull-left mrg-h-lg mrg-r-xs" href="javascript:app.nfs.paste(false);">
                                        <i class="fa fa-trash-o fa-lg"></i>
                                        <span>粘贴</span>
                                    </a>
                                    <a class="btn btn-primary pull-right afterbtn mrg-h-lg" href="javascript:app.nfs.rmdir(false);">
                                        <i class="fa fa-trash-o fa-lg"></i>
                                        <span>删除</span>
                                    </a>-->
                                </div>
                                <div class="pull-right filter-block">
                                    <!--<a class="btn btn-primary pull-left beforebtn" et="click:add_list"
                                       data-toggle="modal" data-target="#modal_one">
                                        <i class="fa fa-plus-circle fa-lg" et="click:add_list"></i>
                                        <span et="click:add_list">排序</span>
                                    </a>-->
                                    <a class="btn btn-primary pull-right afterbtn mrg-h-lg" et="click:del_select"
                                       href="javascript:app.mui.olist=!app.mui.olist;app.nfs.nlist(app.nfs.cpath, false);">
                                        <i class="fa fa-trash-o fa-lg" et="click:del_select"></i>
                                        <span et="click:del_select">视图</span>
                                    </a>
                                </div>
                            </script>

                            <!--路径列表 - 模板 -->
                            <script id="nlist-path" type="text/template">
                                <span id="list_head_left"></span>
                                <span id="list_head_center">{@each paths as dir}<a
                                        href="javascript:app.nfs.nlist('${dir.path}');">${dir.name}/</a>{@/each}</span>
                                <span id="list_head_right"></span>
                            </script>

                            <!--目录列表 - 模板 -->
                            <script id="nlist-list-table" type="text/template">
                                <table class="tree-browser" cellpadding="0" cellspacing="0">
                                    <tbody id="dirs-files-list">
                                    <th><font color="green">文件列表加载中...</font></th>
                                    </tbody>
                                </table>
                            </script>
                            <script id="nlist-list-main" type="text/template">
                                {# 表格头部 }

                                {# 目录列表 }
                                {@each list.dirs as dir,idx}
                                <tr class="dir-list-${idx}">
                                    <td><input class="dir-checkbox-id" name="dir-checkbox" type="checkbox"
                                               value="${dir.path}"/></td>
                                    <td><span class="ext ext_folder_open"></span></td>
                                    <td><a href="javascript:void(0);" onclick="app.nfs.nlist('${dir.path}')"
                                           id="dir-id-${idx}" data-path="${dir.path}" data-name="${dir.name}"
                                           data-mtime="${dir.mtime}" data-chmod="${dir.chmod}">${dir.name}</a></td>
                                    <td>${dir.fmtime}</td>
                                    <td>no size</td>
                                    <td title="${dir.fchmod}">${dir.chmod}</td>

                                    <td><a href="javascript:app.nfs.zip('${dir.path}','${dir.name}')">打包</a></td>
                                    <td><a href="javascript:app.nfs.download('${dir.path}','${dir.name}','dir')">下载</a>
                                    </td>
                                    <td><a href="javascript:app.nfs.rmdir('${dir.path}','${dir.name}', 'dir')">删除</a>
                                    </td>
                                </tr>
                                {@/each}

                                {# 文件列表 }
                                {@each list.files as file,idx}
                                <tr class="file-list-${idx}">
                                    <td><input class="file-checkbox-id" name="file-checkbox" type="checkbox"
                                               value="${file.path}"/></td>
                                    <td><span class="ext ext_${file.ext}"></span></td>
                                    {@if file.ext=='jpg' || file.ext=='png' || file.ext=='gif' || file.ext=='bmp'}
                                    <td><a href="${nfs.host}${nfs.path}${file.path}" onclick="return false;"
                                           id="file-id-${idx}" data-path="${file.path}" data-name="${file.name}"
                                           data-ext="${file.ext}" data-mtime="${file.mtime}" data-chmod="${file.chmod}"
                                           title="双击预览图片" rel="show"
                                           colortitle="文件名称：<font color=red>${file.name}&nbsp;&nbsp;&nbsp;&nbsp;</font>图片大小: <font color=red>${file.fsize}</font>">${file.name}</a>
                                    </td>
                                    {@else}
                                    <td><a href="${nfs.host}${nfs.path}${file.path}" id="file-id-${idx}"
                                           data-path="${file.path}" data-name="${file.name}" data-ext="${file.ext}"
                                           title="${file.name}" data-mtime="${file.mtime}" data-chmod="${file.chmod}"
                                           target="_blank">${file.name}</a></td>
                                    {@/if}
                                    <td>${file.fmtime}</td>
                                    <td>${file.fsize}</td>
                                    <td title="${file.fchmod}">${file.chmod}</td>

                                    <td>
                                        <a href="javascript:app.nfs.download('${file.path}', '${file.name}', 'file')">下载</a>
                                    </td>
                                    <td>
                                        <a href="javascript:app.nfs.rmdir('${file.path}', '${file.name}', 'file')">删除</a>
                                    </td>
                                    <td>--</td>
                                </tr>
                                {@/each}
                            </script>
                            <!--目录列表 - 模板 -->
                            <script id="nlist-icon" type="text/template">
                                <table id="view-dirs-files-list">
                                    <tr>
                                        <td class="rhumbnail">
                                            {# 表格头部 }
                                            <div>
                                                <ol class="f_icon rounded"><a href="javascript:void(0);"
                                                                              onclick="app.nfs.nlist('${path.parent}')">
                                                        <div class="ext_big ext_big_upto"></div>
                                                    </a></ol>
                                                <ol class="f_name" style="color: #006600">返回上级目录</ol>
                                            </div>

                                            {# 目录列表 }
                                            {@each list.dirs as dir,idx}
                                            <div style="position:relative;left:0px;top:0px;">
                                                <ol class="f_icon rounded">
                                                    <a href="javascript:void(0);" onclick="app.nfs.nlist('${dir.path}')"
                                                       id="dir-id-${idx}" data-path="${dir.path}"
                                                       data-name="${dir.name}" data-mtime="${dir.mtime}"
                                                       data-chmod="${dir.chmod}">
                                                        <div class="ext_big ext_big_dir"></div>
                                                    </a>
                                                </ol>
                                                <ol class="f_name" style="color: #0000ff">
                                                    ${dir.name}
                                                </ol>
                                                <span style="position:absolute;left:10px;top:85px;">
							<input class="dir-checkbox-id" name="dir-checkbox" type="checkbox" value="${dir.path}"/>
						</span>
                                            </div>
                                            {@/each}

                                            {# 文件列表 }
                                            {@each list.files as file,idx}
                                            <div style="position:relative;left:0px;top:0px;">
                                                {@if file.ext=='jpg' || file.ext=='png' || file.ext=='gif' ||
                                                file.ext=='bmp'}
                                                <ol class="f_icon rounded">
                                                    <a href="${nfs.host}${nfs.path}${file.path}" id="file-id-${idx}"
                                                       title="双击预览图片" rel="show" onclick="return false;"
                                                       data-path="${file.path}" data-name="${file.name}"
                                                       data-chmod="${file.chmod}" data-ext="${file.ext}"
                                                       data-mtime="${file.mtime}"
                                                       colortitle="文件名称：<font color=red>${file.name}&nbsp;&nbsp;&nbsp;&nbsp;</font>图片大小: <font color=red>${file.fsize}</font>">
                                                        <div class="ext_big ext_big_${file.ext}"></div>
                                                    </a>
                                                </ol>
                                                {@else}
                                                <ol class="f_icon rounded">
                                                    <a href="${nfs.host}${nfs.path}${file.path}" id="file-id-${idx}"
                                                       title="${file.name}" target="_blank" data-path="${file.path}"
                                                       data-name="${file.name}" data-chmod="${file.chmod}"
                                                       data-ext="${file.ext}">
                                                        <div class="ext_big ext_big_${file.ext}"></div>
                                                    </a>
                                                </ol>
                                                {@/if}
                                                <ol class="f_name" style="color: #ff0000">
                                                    ${file.name}
                                                </ol>
                                                <span style="position:absolute;left:10px;top:85px;">
							<input class="file-checkbox-id" name="file-checkbox" type="checkbox" value="${file.path}"/>
						</span>
                                            </div>
                                            {@/each}
                                        </td>
                                    </tr>
                                </table>
                            </script>

                            <script id="app-nfs-rename" type="text/template">
                                {@if code == 200}
                                <font color="green">命名成功：</font><font color="red">${name}</font><br/>
                                <font color="green">执行耗时：</font><font color="red">${time} 秒</font><br/>
                                {@else}
                                <font color="blue">重命名失败：</font><font color="red">${message}</font><br/>
                                {@/if}
                            </script>

                            <script id="app-nfs-pathinfo" type="text/template">
                                {@if code == 200}
                                <font color="green">当前目录：</font><font color="red">${data.path}</font><br/>
                                <font color="green">目录详情：</font><font color="red">包含 ${data.dnums} 个文件夹，${data.fnums}
                                    个文件，共计 ${data.fsize}</font><br/>
                                <font color="green">目录权限：</font><font color="red">${data.chmod} -
                                    [${data.fchmod}]</font><br/>
                                <font color="green">执行耗时：</font><font color="red">${time} 秒</font><br/>
                                {@else}
                                <font color="blue">获取属性失败：</font><font color="red">${message}</font><br/>
                                {@/if}
                            </script>

                            <script id="app-nfs-del" type="text/template">
                                {@if code == 200}
                                <font color="green">成功删除：</font><font color="red">${data.ds} 文件夹，${data.fs} 个文件，共计
                                    ${data.si}</font><br/>
                                {@each data.el as item}
                                <font color="blue">删除失败：</font><font color="red">${item}</font><br/>
                                {@/each}
                                {@else}
                                <font color="blue">删除失败：</font><font color="red">${message}</font><br/>
                                {@/if}
                                <font color="green">执行耗时：</font><font color="red">${time} 秒</font><br/>
                            </script>

                            <script id="app-nfs-zip" type="text/template">
                                {@if code == 200}
                                <font color="green">目标文件：</font><font color="red">${data.name}</font><br/>
                                <font color="green">文件详情：</font><font color="red">包含 ${data.dn} 个文件夹，${data.fn}
                                    个文件</font><br/>
                                <font color="green">文档大小：</font><font color="red">共计 ${data.si}，压缩后 ${data.sc}</font>
                                <br/>
                                <font color="green">执行耗时：</font><font color="red">${time} 秒</font><br/>
                                {@else}
                                <font color="blue">压缩失败：</font><font color="red">${message}</font><br/>
                                <font color="green">压缩耗时：</font><font color="red">${time} 秒</font><br/>
                                {@/if}
                            </script>

                            <script id="app-nfs-unzip" type="text/template">
                                {@if code == 200}
                                <font color="green">目标文件：</font><font color="red">${data.name}</font><br/>
                                <font color="green">文件详情：</font><font color="red">包含 ${data.dn} 个文件夹，${data.fn}
                                    个文件</font><br/>
                                <font color="green">文档大小：</font><font color="red">共计 ${data.sc}，解压后 ${data.si}</font>
                                <br/>
                                <font color="green">解压耗时：</font><font color="red">${time} 秒</font><br/>
                                {@else}
                                <font color="blue">解压失败：</font><font color="red">${message}</font><br/>
                                <font color="green">解压耗时：</font><font color="red">${time} 秒</font><br/>
                                {@/if}
                            </script>

                            <script id="app-nfs-paste" type="text/template">
                                {@if data.mode == 'cut'}
                                {@if json.code == 200}
                                <font color="green">极速移动：</font><font color="red">${json.data.success}
                                    个成功，${json.data.errors} 个失败</font><br/>
                                <font color="green">移动耗时：</font><font color="red">${json.time} 秒</font><br/>
                                {@each json.data.permission as file}
                                <font color="blue">无访问权限：</font><font color="red">${file}</font><br/>
                                {@/each}
                                {@each json.data.exists as file}
                                <font color="blue">文件已存在：</font><font color="red">${file}</font><br/>
                                {@/each}
                                {@else}
                                <font color="blue">移动失败：</font><font color="red">${message}</font><br/>
                                <font color="green">移动耗时：</font><font color="red">${time} 秒</font><br/>
                                {@/if}
                                {@else}
                                {@if json.code == 200}
                                <font color="green">极速复制：</font><font color="red">${json.data.success}
                                    个成功，${json.data.errors} 个失败</font><br/>
                                <font color="green">包含耗时：</font><font color="red">${json.data.dnumber}
                                    个文件夹，${json.data.fnumber}文件</font><br/>
                                <font color="green">复制耗时：</font><font color="red">${json.time} 秒，共复制
                                    ${json.data.size}</font><br/>
                                {@each json.data.permission as file}
                                <font color="blue">无访问权限：</font><font color="red">${file}</font><br/>
                                {@/each}
                                {@each json.data.exists as file}
                                <font color="blue">文件已存在：</font><font color="red">${file}</font><br/>
                                {@/each}
                                {@else}
                                <font color="blue">复制失败：</font><font color="red">${message}</font><br/>
                                <font color="green">复制耗时：</font><font color="red">${time} 秒</font><br/>
                                {@/if}
                                {@/if}
                            </script>

                            <script id="app-nfs-chmod" type="text/template">
                                <style type="text/css">
                                    #container {
                                        width: 420px;
                                        margin: 0 auto;
                                    }

                                    fieldset {
                                        background: #f2f2e6;
                                        padding: 0px;
                                        border: 1px solid #fff;
                                        border-color: #fff #666661 #666661 #fff;
                                        margin-bottom: 0px;
                                        width: 420px;
                                    }

                                    input, textarea, select {
                                        font: 12px/12px Arial, Helvetica, sans-serif;
                                        padding: 0;
                                    }

                                    fieldset.action {
                                        background: #9da2a6;
                                        border-color: #316AC5;
                                        margin-top: -20px;
                                    }

                                    legend {
                                        background: #bfbf30;
                                        color: #fff;
                                        font: 17px/21px Calibri, Arial, Helvetica, sans-serif;
                                        padding: 0 10px;
                                        margin: 0;
                                        font-weight: bold;
                                        border: 1px solid #fff;
                                        border-color: #e5e5c3 #505014 #505014 #e5e5c3;
                                    }

                                    label {
                                        font-size: 11px;
                                        font-weight: bold;
                                        color: #666;
                                    }

                                    label.opt {
                                        font-weight: normal;
                                    }

                                    dl {
                                        clear: both;
                                    }

                                    dt {
                                        float: left;
                                        text-align: right;
                                        width: 90px;
                                        line-height: 25px;
                                        margin: 0 10px 10px 0;
                                    }

                                    dd {
                                        float: left;
                                        width: 300px;
                                        line-height: 25px;
                                        margin: 0 0 10px 0;
                                    }
                                </style>
                                <div id="container" style="background-color: #F2F2E6;">
                                    <form action="" method="post" class="niceform">
                                        <fieldset>
                                            <dl>
                                                <dt><label for="color">包含子目录:</label></dt>
                                                <dd>
                                                    <input type="radio" name="chmod_deep" id="deep_chmod_1" value="1"
                                                           {@if type=='file'}disabled{@/if}> <label for="deep_1"
                                                                                                    class="opt">是</label>
                                                    <input type="radio" name="chmod_deep" id="deep_chmod_0" value="0"
                                                           {@if type=='file'}disabled{@/if} checked="checked"/> <label
                                                        for="deep_0" class="opt">否</label>
                                                </dd>
                                            </dl>
                                            <dl>
                                                <dt><label for="interests">所有者权限:</label></dt>
                                                <dd>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_owner_read" value="400"/> <label for="read"
                                                                                                      class="opt">读取</label>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_owner_write" value="200"/> <label for="write"
                                                                                                       class="opt">写入</label>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_owner_exec" value="100"/> <label for="run"
                                                                                                      class="opt">执行</label>
                                                </dd>
                                            </dl>
                                            <dl>
                                                <dt><label for="interests">同组权限:</label></dt>
                                                <dd>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_group_read" value="40"/> <label for="read"
                                                                                                     class="opt">读取</label>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_group_write" value="20"/> <label for="write"
                                                                                                      class="opt">写入</label>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_group_exec" value="10"/> <label for="run"
                                                                                                     class="opt">执行</label>
                                                </dd>
                                            </dl>
                                            <dl>
                                                <dt><label for="interests">公共权限:</label></dt>
                                                <dd>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_public_read" value="4"/> <label for="read"
                                                                                                     class="opt">读取</label>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_public_write" value="2"/> <label for="write"
                                                                                                      class="opt">写入</label>
                                                    <input type="checkbox" onclick="set_chmod_num();"
                                                           id="chmod_public_exec" value="1"/> <label for="run"
                                                                                                     class="opt">执行</label>
                                                </dd>
                                            </dl>
                                            <dl>
                                                <dt><label for="interests">数值化权限:</label></dt>
                                                <dd><input type="text" id="num_chmod" size="20" value="${chmod}"
                                                           readonly/></dd>
                                            </dl>
                                        </fieldset>
                                    </form>
                                </div>
                            </script>
                            <script id="app-nfs-chmod-x" type="text/template">
                                <font color="green">修改项目：</font><font color="red">${data.name} [${data.chmod}]</font>
                                <br/>
                                <font color="green">总计修改：</font><font color="red">${data.dn} 个目录，${data.fn} 个文件，失败
                                    ${data.en}个</font><br/>
                                {@each data.el as item}
                                <font color="blue">修改失败：</font><font color="red">${item}</font><br/>
                                {@/each}
                                <font color="green">修改耗时：</font><font color="red">${time} 秒</font><br/>
                            </script>

                            <iframe id="app-nfs-down" src="" frameborder="0" width="0" height="0"></iframe>
                        </div>
                    </div>
                    <!--left content end-->
                </div>
                <div id="footer-bar" style="opacity: 1;">
                    <p id="footer-copyright" class="col-xs-12" sh_lang="copyright"></p>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>

<!-- jQuery 库文件、模板引擎-->
<script src="static/js/jquery-1.7.2.min.js"></script>
<script src="static/js/juicer-0.6.5.min.js"></script>

<!-- artDialog 资源文件 -->
<link rel="stylesheet" href="static/plugins/artDialog/skins/default.css?v=4.1.7"/>
<script src="static/plugins/artDialog/jquery.artDialog.min.js?v=4.1.7"></script>

<!-- contextMenu 资源文件 -->
<link rel="stylesheet" href="static/plugins/contextMenu/jquery.contextMenu.css?v=1.1.0"/>
<script src="static/plugins/contextMenu/jquery.contextMenu.js?v=1.1.0"></script>

<!-- colorBox 资源文件 -->
<link rel="stylesheet" href="static/plugins/colorBox/jquery.colorBox.css?v=1.3.17.2"/>
<script src="static/plugins/colorBox/jquery.colorBox.min.js?v=1.3.17.2"></script>

<!-- ZeroClipboard 资源文件 -->
<script src="static/plugins/ZeroClipboard/ZeroClipboard.min.js?v=1.3.2"></script>

<!-- app 资源文件-->
<script src="static/js/webftp.core.js"></script>
<script src="static/js/webftp.util.js"></script>
<script src="static/js/webftp.nfs.js"></script>
<script src="static/js/webftp.mui.js"></script>

<script type="text/javascript">
    $(function () {
        // 配置参数
        // app.debug = true;
        app.api = {
            url: 'webftp.php',
            key: '0123456789',
            auth: '<?php $auth = wf_gpc('wf_uauth', 's'); echo implode(',', $auth);?>'.split(',')
        };

        // 执行初始化
        app.mui.init();
        app.nfs.init();
    });
</script>