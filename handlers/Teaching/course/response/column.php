<?php

function Teaching_course_response_column($params)
{
	$publisherId = Communities::requestedId($params, 'publisherId');
	$courseId = Q::ifset($params, 'courseId', Communities::requestedId($params, 'courseId'));
	$streamName = 'Teaching/course/'.$courseId;

	$stream = Streams::fetchOne(null, $publisherId, $streamName);

	$url = Q_Uri::url("Teaching/course publisherId=$publisherId courseId=$courseId");

	$column = Q::view('Teaching/column/course.php', compact('stream'));

	Q_Response::addScript('{{Teaching}}/js/columns/course.js', "Teaching");
	Q_Response::addStylesheet('{{Teaching}}/css/columns/course.css', "Teaching");
	Q_Response::addScript('{{Teaching}}/js/columns/courses.js', "Teaching");
	Q_Response::addStylesheet('{{Teaching}}/css/columns/courses.css', "Teaching");

	Teaching::$columns['course'] = array(
		'title' => $stream->title,
		'column' => $column,
		'name' => 'course',
		'expandOnMobile' => array('top' => false, 'bottom' => false),
		'columnClass' => 'Teaching_column_course',
		'url' => $url
	);

	Q_Response::setSlot('title', $stream->title);

	$title = $stream->title;
	$description = $stream->content;
	$image = Q_Html::themedUrl('img/icon/400.png');
	Q_Response::setCommonMetas(compact(
		'title', 'description', 'image', 'url'
	));
	return $column;
}

