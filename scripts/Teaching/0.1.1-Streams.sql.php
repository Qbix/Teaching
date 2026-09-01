<?php
	
function Streams_0_1_1_Streams()
{
	echo "Adding access for Teaching/course type".PHP_EOL;

	$streamType = "Teaching/course";
	$adminLabels = Streams_Stream::getConfigField($streamType, 'admins', array());
	foreach ($adminLabels as $adminLabel) {
		$access = new Streams_Access();
		$access->publisherId = "";
		$access->streamName = $streamType."*";
		$access->ofContactLabel = $adminLabel;
		$access->readLevel = 40;
		$access->writeLevel = 40;
		$access->adminLevel = 40;
		$access->save(true);
	}

	echo "Adding access for Teaching/courses/main type".PHP_EOL;
	$publisherId = Users::communityId();
	$streamName = "Teaching/courses/main";
	$stream = Streams::fetchOneOrCreate($publisherId, $publisherId, $streamName);
	$adminLabels = Streams_Stream::getConfigField($stream->type, 'admins', array());
	$adminLabels[] = "Users/teachers";
	$adminLabels = array_unique($adminLabels);
	foreach ($adminLabels as $adminLabel) {
		$access = new Streams_Access();
		$access->publisherId = "";
		$access->streamName = $streamName;
		$access->ofContactLabel = $adminLabel;
		$access->readLevel = 40;
		$access->writeLevel = 30;
		$access->adminLevel = 30;
		$access->save(true);
	}

	echo PHP_EOL;
}

Streams_0_1_1_Streams();