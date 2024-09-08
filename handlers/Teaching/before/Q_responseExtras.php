<?php

function Teaching_before_Q_responseExtras()
{
	if (!Q_Request::isAjax()) {
		Q_Response::addStylesheet('{{Teaching}}/css/Teaching.css', "Teaching");
		Q_Response::addScript('{{Teaching}}/js/Teaching.js', "Teaching");
		Q_Response::addScript('{{Q}}/js/tools/lazyload.js');
		Q_Response::setImageSizes('Teaching/course');
	}
}
