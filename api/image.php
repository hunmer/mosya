<?php
use voku\helper\HtmlDomParser;
require_once 'vendor/autoload.php';


header("Access-Control-Allow-Origin: *");
$_GET['type'] = 'search';
// $_GET['name'] = '深海少女';
 $_GET['id'] = 'I0bDMBXM_Fk';


$type = getParam('type');
$server = getParam('server', 'pinterest');
if($server == 'pinterest'){
	switch ($type) {
		case 'search':
			$ch = curl_init();
			$options =  array(
				CURLOPT_HEADER => false,
				CURLOPT_URL => 'https://www.pinterest.com/search/pins/?q=%E8%B7%AF%E8%A5%BF%E6%B3%95',
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT => 10,
				CURLOPT_PROXYAUTH => CURLAUTH_BASIC,
				CURLOPT_SSL_VERIFYPEER => false,
				CURLOPT_SSL_VERIFYHOST => false,
				CURLOPT_PROXY => "127.0.0.1",
				CURLOPT_PROXYPORT => 1080,
				CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36 Edg/81.0.416.58'
			);
				curl_setopt_array($ch, $options);
			// $content = curl_exec($ch);
				// file_put_contents('test.html', $content);
				// $dom = HtmlDomParser::str_get_html($content);
				$dom = HtmlDomParser::file_get_html('test.html');
				foreach ($dom->find('.GrowthUnauthPinImage') as $v) {
					var_dump($v->findOne('a')->getAttribute('title'));
				}
				curl_close($ch);
			
			exit();
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

			// foreach($json['formats'] as $v){
			// 	if(!is_null($v['filesize'])){
					$s_url = 'https://alltubedownload.net/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'.getParam('id').'&format='.$json['format_id'];
					//break;
				//}
			//}
					// echo $s_url;
			curl_close($ch);
			
			header('Location: '.$s_url);
			break;
	}
	return;
}


function getParam($key, $default=''){
    return trim($key && is_string($key) ? (isset($_POST[$key]) ? $_POST[$key] : (isset($_GET[$key]) ? $_GET[$key] : $default)) : $default);
}
