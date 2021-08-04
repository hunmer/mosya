<?php

header("Access-Control-Allow-Origin: *");
set_time_limit(-1);
// search.php?server=&type=search&name=
// $_GET['type'] = 'lyric';
// $_GET['id'] = '857619';

// $_GET['type'] = 'search';
// $_GET['name'] = '深海少女';

 // $_GET['type'] = 'cover';
 // $_GET['id'] = '18722483998223156';

// $_GET['id'] = 'ZdcO67G34Yw';
// $_GET['server'] = 'youtube';
// $_GET['type'] = 'url';

$options = array(
		CURLOPT_HEADER => false,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_TIMEOUT => 10,
		CURLOPT_PROXYAUTH => CURLAUTH_BASIC,
		CURLOPT_SSL_VERIFYPEER => false,
		CURLOPT_SSL_VERIFYHOST => false,
		CURLOPT_PROXY => "127.0.0.1",
		CURLOPT_PROXYPORT => 1080,
		CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36 Edg/81.0.416.58'
	);

$type = getParam('type');
$server = getParam('server');
if($server == 'youtube'){
	switch ($type) {
		 case 'id':
			$ch = curl_init();
			$options[CURLOPT_URL] = 'https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id='.getParam('id').'&key=AIzaSyC2M5g_EB_VZO-1OVC68iGL6dcJ9XApJT0';
			curl_setopt_array($ch, $options);
			$content = json_decode(curl_exec($ch), true);
			curl_close($ch);
			if(count($content['items']) > 0){
				$detail = $content['items'][0];
				$id = $detail['id'];
				$ret = [
					'id' => $id,
					'name' => $detail['snippet']['title'],
					'artist' => $detail['snippet']['channelTitle'],
					'pic' => $detail['snippet']['thumbnails']['medium']['url'],
					'url' => 'https://alltubedownload.net/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'.$id,
					'source' => 'youtube'
				];
			}
			echo json_encode($ret);
			break;
		case 'list':
			$ch = curl_init();
			$options[CURLOPT_URL] = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=' . getParam('id') . '&key=AIzaSyC2M5g_EB_VZO-1OVC68iGL6dcJ9XApJT0';
			curl_setopt_array($ch, $options);
			$content = json_decode(curl_exec($ch), true);
			curl_close($ch);

			$ret = [];
			foreach($content['items'] as $detail){
				$ret[] = [
					'id' => $detail['snippet']['resourceId']['videoId'],
					'name' => $detail['snippet']['title'],
					'artist' => $detail['snippet']['channelTitle'],
					'pic' => $detail['snippet']['thumbnails']['medium']['url'],
					'url' => 'https://alltubedownload.net/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'.$id,
					'source' => 'youtube'
				];
			}
			echo json_encode($ret);
			break;
		case 'search':
			$ch = curl_init();
			$options[CURLOPT_URL] = 'https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=' . urlencode(getParam('name')) . '&key=AIzaSyC2M5g_EB_VZO-1OVC68iGL6dcJ9XApJT0';
			curl_setopt_array($ch, $options);
			$content = json_decode(curl_exec($ch), true);
			curl_close($ch);

			$ret = [];
			foreach($content['items'] as $detail){
				$id = $detail['id']['videoId'];
				$ret[] = [
					'id' => $id,
					'name' => $detail['snippet']['title'],
					'artist' => $detail['snippet']['channelTitle'],
					'pic' => $detail['snippet']['thumbnails']['medium']['url'],
					'url' => 'https://alltubedownload.net/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'.$id,
					'source' => 'youtube'
				];
			}
			echo json_encode($ret);
			break;

		case 'url':
			$ch = curl_init();
			$options =  array(
				CURLOPT_URL => 'https://alltubedownload.net/json?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'.getParam('id'),
				CURLOPT_HEADER => false,
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT => 30,
				CURLOPT_PROXYAUTH => CURLAUTH_BASIC,
				CURLOPT_SSL_VERIFYPEER => false,
				CURLOPT_SSL_VERIFYHOST => false,
				CURLOPT_PROXY => "127.0.0.1",
				CURLOPT_PROXYPORT => 1080,
				CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36 Edg/81.0.416.58'
			);
			curl_setopt_array($ch, $options);
			$json = json_decode(curl_exec($ch), true);
			$format = getParam('format');
			$isVideo = getParam('video') != '';
			foreach($json['formats'] as $v){
				if(!is_null($v['filesize']) ){
					if($isVideo){
						if($v['ext'] == 'mp4' && $v['acodec'] != 'none'){
							$s_url = 'https://alltubedownload.net/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'.getParam('id').'&format='.$v['format_id'];
							break;
						}
						continue;
					}
					$s_url = 'https://alltubedownload.net/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'.getParam('id').'&format='.$v['format_id'];
					break;
				}
			}
			curl_close($ch);
			header('Location: '.$s_url);
			break;
	}
	return;
}

function getParam($key, $default=''){
    return trim($key && is_string($key) ? (isset($_POST[$key]) ? $_POST[$key] : (isset($_GET[$key]) ? $_GET[$key] : $default)) : $default);
}
