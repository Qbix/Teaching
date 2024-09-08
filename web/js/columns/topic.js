"use strict";
(function(Q, $, undefined) {
	Q.exports(function (options, index, div, data) {
		Q.addStylesheet("{{Teaching}}/css/columns/topic.css");
		
		var topicTool = Q.Tool.from($(".Streams_topic_tool", div)[0], 'Streams/topic');
		if (topicTool) {
			$(".Streams_topic_bg", topicTool.element).css("background-image", $(".Teaching_course_image", $(div).siblings(".Teaching_column_course")).css("background-image"));

			Q.Streams.get(topicTool.state.publisherId, topicTool.state.streamName, function (err) {
				if (err) {
					return;
				}

				var stream = this;
				stream.onFieldChanged("title").set(function (modFields, field) {
					stream.refresh(function () {
						Q.replace($(".Q_columns_title .Q_title_slot", div)[0], this.fields.title);
					}, {
						messages: true,
						evenIfNotRetained: true
					});
				}, topicTool);
			});
		}
	});
})(Q, Q.jQuery);