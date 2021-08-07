<?php

header("Access-Control-Allow-Origin: *");
set_time_limit(-1);
// search.php?server=&type=search&name=
// $_GET['type'] = 'search';
// $_GET['s'] = '今天也悠然自得';

// $_GET['type'] = 'ids';
// $_GET['id'] = 9136624;

$options = array(
    CURLOPT_HEADER => false,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_PROXYAUTH => CURLAUTH_BASIC,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_PROXY => "127.0.0.1",
    CURLOPT_PROXYPORT => 1080,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36 Edg/81.0.416.58',
);

$type = getParam('type');
switch ($type) {
    case 'search':
        $url = 'https://store.line.me/api/search/sticker?query=' . urlencode(getParam('s')) . '&offset=0&limit=36&type=ALL&includeFacets=true';
        break;

    case 'ids':
        $url = 'https://sdl-stickershop.line.naver.jp/products/0/0/1/' . getParam('id') . '/android/productInfo.meta';
        break;
}

if (isset($url)) {
    $ch = curl_init();
    $options[CURLOPT_URL] = $url;
    curl_setopt_array($ch, $options);
    $content = json_decode(curl_exec($ch), true);
    curl_close($ch);
    if ($content == null) {
        return;
    }
    switch ($type) {
        case 'search':
            $ret = [];
            foreach ($content['items'] as $detail) {
                $ret[] = [
                    'id' => $detail['id'],
                    'name' => $detail['title'],
                    'icon' => $detail['listIcon']['src'],
                    'hasAnimation' => $detail['payloadForProduct']['animationUrl'] != null,
                    'hasSound' => $detail['payloadForProduct']['soundUrl'] != null,
                ];
            }
            break;

        case 'ids':
            $ids = [];
            foreach ($content['stickers'] as $img) {
                $ids[] = $img['id'];
            }

            $ret = [
                'id' => $content['packageId'],
                'name' => _get($content, ['title.ja', 'title.en']),
                'author' => _get($content, ['author.ja', 'author.en']),
                'stickers' => $ids,
                'hasAnimation' => $content['hasAnimation'],
                'hasSound' => $content['hasSound'],
            ];
            break;
    }
    echo json_encode($ret);
}

function _get($data, $keys, $default = '')
{
    foreach ($keys as $key) {

        $value = array_get($data, $key);
        if ($value != null) {
            return $value;
        }

    }
    return $default;
}

function getParam($key, $default = '')
{
    return trim($key && is_string($key) ? (isset($_POST[$key]) ? $_POST[$key] : (isset($_GET[$key]) ? $_GET[$key] : $default)) : $default);
}

function array_get($array, $key, $default = null)
{
    if (is_null($key)) {
        return $array;
    }

    if (isset($array[$key])) {
        return $array[$key];
    }

    foreach (explode('.', $key) as $segment) {
        if (!is_array($array) || !array_key_exists($segment, $array)) {
            return $default;
        }

        $array = $array[$segment];
    }
    return $array;
}
