"use strict";
(function(Q, $, undefined) {
	Q.exports(function (options, index, div, data) {
		Q.addStylesheet("{{Teaching}}/css/columns/topic.css");

		var courseTool = Q.Tool.from($(".Teaching_course_tool", div)[0], 'Teaching/course');
		if (courseTool) {
			Q.Streams.get(courseTool.state.publisherId, courseTool.state.streamName, function (err) {
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
				}, courseTool);
			});
		}
	});
})(Q, Q.jQuery);