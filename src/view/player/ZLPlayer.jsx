import React from 'react';
import "./ZLPlayer.less"
import {findChannelByVas,GetRecordFileList,DeleteRecordFile} from "../../service/channel";
import queryString from 'query-string';
import Loader from "../../component/Loader";
import {Icon,message, Input, Radio, Tabs, Tooltip,Table, Divider,Pagination} from "antd";
import ReactPlayer from '../../component/ReactPlayer';
import UAParser from 'ua-parser-js';
import ReactTimeout from "react-timeout";
import classNames from "classnames";
import {apiDomin} from "../../config/apiconfig";
import AKStreamPlayer from '../../component/RvJessibuca/App.js';
import {StreamLive} from "../../service/channel";


@ReactTimeout
export default class ZLPlayer extends React.Component {

    constructor(props) {
        super(props);
        //const that = this;
        this.channelParams = queryString.parse(this.props.location.search);

        const {stream} = this.channelParams;
        this.state = {
            data:[],
            recordparams:{
                pageIndex:1,
                pageSize:2,
                mainId:stream,
                deleted:false,
            },
            dataTotal: 0,
            iframe: false,
            channelData: null,
            currentUrl:'',
            isLive:true,
            playBaseProps: {
                muted: true,
                videoProps: {
                    className: "zpplayer-player-video",
                },
                playerProps: {},
                onKernelError: () => {
                    console.log("onKernelError")
                },
                onCanPlay: () => {
                    this.reactPlayer.play()
                },
                onWaiting: (a, b, c, d) => {
                    console.log("onWaiting")
                },
                onEmptied: () => {
                    console.log("onEmptied")
                },

                onCanPlayThrough: () => {
                    console.log("onCanPlayThrough")
                },
                onLoadedData: () => {
                    console.log("onLoadedData")
                },
                onLoadedMetadata: () => {
                    console.log("onLoadedMetadata")
                },
                onError: () => {
                    console.log("onError")
                }
            },
        }
        

    }
    componentDidMount() {
        document.body.style.minWidth = "100px";
        const ua = UAParser(global.navigator.userAgent);
        this.channelParams = queryString.parse(this.props.location.search);

        const {mediaServerIp,mediaServerId, vhost, app, stream, iframe=false} = this.channelParams;
		StreamLive(mediaServerId,stream).then(res => {
			if(res._success && res._statusCode === 200 && res.data)
			{
                const urldata = {
                    play_addrs:{
                        flv:res.data.playUrl[1],
                        hls:res.data.playUrl[4],
                        rtmp:res.data.playUrl[3],
                        rtsp:res.data.playUrl[2],
                    }
                }

                this.setState({
                    loading: true,
                    iframe
                }, () => {
                    this.setState({
                        channelData: urldata,
                        currentUrl:urldata.play_addrs.flv,
                        params: this.channelParams,
                    }, () => {
                        this.changePlayType("flvjs")
                    })
                    this.setState({
                        loading: false,
                    })
                })
            }
        })
        this.loadData(this.state.recordparams)
    }

    loadData = (params) => {
    	GetRecordFileList({
    	    pageIndex: params ? params.pageIndex : this.state.recordparams.pageIndex,
    	    pageSize: this.state.pageSize,
			orderBy: [
			    {
			      "fieldName": "recordDate",
			      "orderByDir": 0
			    }
			],
            mainId:this.state.recordparams.mainId,
            deleted:false,
    	    // active: 1,
    	    ...params
    	}).then(res => {
    	    this.setState({
    	        data: res.data.recordFileList,
    	        dataTotal: res.data.total,
    	        pageIndex: res.data.request.pageIndex,
    	        pageSize: res.data.request.pageSize,
    	    })
    	})
    }

    playRecord = (record) => {
        this.setState({
            isLive:false,
            currentUrl: record.downloadUrl,
        })
    }

    downRecord = (videoUrl) => {
        StreamLive(channel.mediaServerId,channel.mainId).then(res => {
			if(res._success && res._statusCode === 200 && res.data)
			{
				message.success('推流成功!');
			}
        })
    }

    deleteRecordFile = (dbId) => {
    	DeleteRecordFile(dbId).then(res => {
    	    if(res._success && res._statusCode === 200 && res.data)
			{
				message.success('删除录像文件成功!');
                this.loadData(this.state.recordparams)
			}
            else
            {
                message.error('删除录像文件失败!');
            }
    	})
    }

    changePlay = (type) => {
        const {channelData} = this.state;
        if (type == "flv") {
            this.setState({
                isLive:true,
                currentUrl: channelData.play_addrs.flv,
            })
        }else if (type == "rtmp") {
            this.setState({
                isLive:true,
                currentUrl: channelData.play_addrs.rtmp.replace('http','rtmp'),
            })
        }
        // else if (type == "rtsp") {
        //     console.log(channelData.play_addrs.rtsp.replace('http','rtsp'))
        //     this.setState({
        //         isLive:true,
        //         currentUrl: channelData.play_addrs.rtsp.replace('http','rtsp'),
        //     })
        // }
        
    }

    changePlayType = (type) => {
        const {channelData} = this.state;
        if (type == "flvjs") {
            this.setState({
                playinfo: {
                    kernel: 'flvjs',
                    vtype: 'flvjs',
                    live: true,
                    src: channelData.play_addrs.flv,
                    type: 'video/x-flv',

                    config: {
                        enableWorker: true,
                        hasAudio: false,
                        //enableStashBuffer: false,
                        //stashInitialSize: 384
                    },
                }
            })
        } else if (type == "hlsjs") {
            this.setState({
                playinfo: {
                    kernel: 'hlsjs',
                    vtype: 'hlsjs',
                    live: true,
                    src: channelData.play_addrs.hls,
                    type: 'application/x-mpegURL',
                }

            })
        } else if (type == "flash_rtmp") {
            this.setState({
                playinfo: {
                    kernel: 'flash',
                    vtype: 'flash_rtmp',
                    live: true,
                    src: channelData.play_addrs.rtmp.replace('http','rtmp'),
                    type: "rtmp/mp4",
                }
            })
        }

    }


    render() {
        // let player = new WasmPlayer(null, 'video', this.callbackfun,{
        //     muted:true,stretch:true,fluent:true,isLive:this.state.isLive
        // })
        // player.play(this.state.currentUrl, 1)

        const {channelData, params, playinfo, playBaseProps} = this.state;
        if (!this.state.channelData || !playinfo) {
            return <Loader spinning={true}/>
        }

        const columns = [
            { title: '录像名称', dataIndex: 'channelName', key: 'channelName' },
            { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
            { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
            { title: '时长(秒)', dataIndex: 'duration', key: 'duration' },
            { 
                title: '文件大小(MB)', dataIndex: 'fileSize', key: 'fileSize',render: (text) => (
                    <span>
                        {
                            Math.round(text / 1024 /1024)
                        }
                    </span>
               ),
            },
            {
              title: '操作',
              key: 'operation',
              fixed: 'right',
              width: 150,
              render: (text,record) => (
                <span>
                    {
                        <a href="javascript:;" onClick={()=>this.playRecord(record)}>播放</a>
                    }
                    <Divider type="vertical" />
                    {
                        <a href={record.downloadUrl}  >下载</a>
                    }
                    <Divider type="vertical" />
                    {
                        <a href="javascript:;" onClick={()=>this.deleteRecordFile(record.id)}>删除</a>
                    }
                </span>
               ),
            },
          ];
          
        
        return (
            
            <div className={classNames("zpplayer-wrapping",{"iframe-wrapping":this.state.iframe})}>
                <div className={"zpplayer-header"}>
                    {channelData.name}
                </div>
                <div className={"zpplayer-content"}>
                    <div className={"zpplayer-video"}>
                        <AKStreamPlayer 
                            playUrl={this.state.currentUrl}
                            hasAudio={false}
                        />
                    </div>
                </div>

            </div>
        );
    }


    static contextTypes = {}
    static propTypes = {}
    static defaultProps = {}
}
