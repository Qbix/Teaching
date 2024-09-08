"use strict";
(function(Q, $, undefined) {
	var Communities = Q.Communities;

Q.exports(function (options, index, div, data) {
	var $titleSlot = $('.Q_title_slot', div);
	var $titleContainer = $('.Q_columns_title_container', div);

	Q.addStylesheet('{{Teaching}}/css/columns/course.css', { slotName: 'Teaching' });

	Q.Text.get('Teaching/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		var _filterCourses = function () {
			var filter = $(this).val();
			var allCourses = $(".Q_column_courses .Teaching_courses .Teaching_course_preview_tool");
			Q.each(allCourses, function () {
				var $this = $(this);

				if (!filter || $(".Teaching_course_titleContent", this).text().toUpperCase().indexOf(filter.toUpperCase()) >= 0) {
					if (Q.info.isMobile) {
						$this.attr('data-match', true);
					} else {
						$this.fadeIn(500);
					}
				} else {
					if (Q.info.isMobile) {
						$this.attr('data-match', false);
					} else {
						$this.fadeOut(500);
					}
				}
			});
		};

		// apply FaceBook column style
		if (Q.getObject('layout.columns.style', Communities) === 'facebook') {
			// Create events search
			var $eventFilter = $('<input name="query" class="Communities_eventChooser_input" placeholder="' + text.courses.filterCourses + '">')
				.on('input', _filterCourses);

			var icons = [
				$("<i class='qp-communities-search Communities_chooser_trigger'></i>").on(Q.Pointer.fastclick, function () {
					$titleSlot.add($(this).closest(".Q_icons_slot")).css('top', -1 * $titleSlot.outerHeight(true));
					$(".Communities_chooser", $titleContainer).css('top', 0);
				})
			];

			var pipe = new Q.pipe(["stream"], function () {
				$titleContainer.tool('Communities/columnFBStyle', {
					icons: icons,
					filter: [$eventFilter]
				}, 'Events_column').activate();
			});
			var relatedTool = Q.Tool.from($(".Streams_related_tool", div)[0], "Streams/related");
			if (relatedTool) {
				Q.Streams.get(relatedTool.state.publisherId, relatedTool.state.streamName, function (err) {
					if (err) {
						return pipe.fill("stream")();
					}

					if (!this.testWriteLevel(23)) {
						return pipe.fill("stream")();
					}

					icons.push($("<i class='qp-communities-plus'></i>").on(Q.Pointer.fastclick, function () {
						var $this = $(this);
						var composer = Q.Tool.from($(".Teaching_course_preview_tool.Streams_preview.Streams_preview_composer", div)[0], "Teaching/course/preview");
						if (composer) {
							$this.addClass("Q_working");
							composer.composer(function () {
								$this.removeClass("Q_working");
							});
						}
					}));
					pipe.fill("stream")();
				});
			} else {
				pipe.fill("stream")();
			}
		}
	});
});

})(Q, Q.jQuery);