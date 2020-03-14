/**
 * Author: @scriptmastership
 */
(function($) {
	
	$(document).ready(function() {

		$.post(ajaxurl, {
			mepr_pro_report_nonce_confirm: mepr_pro_report.nonce,
			action: 'admin_hook',
			dataType: "json"
		}, function(result) {
			var data = JSON.parse(result);

			$('#mepr_pro_report_loading').hide();
			$('#mepr_pro_report_date_filter').show();
			$('.mepr_pro_report_box').show();

			MeprProReportChart.init('mepr_pro_report_chart', 'mepr_pro_report_chart_options', 'mepr_pro_report_chart_tooltip');
			MeprProReportSalesTable.init('mepr_pro_report_sales');
			MeprProReportProductFilter.init(data.products, 'mepr_pro_report_product_filter');
			MeprProReportDateFilter.init(data.transactions, 'mepr_pro_report_date_filter');
		});

		var MeprProReportDateFilter = (function () {
			
			var _transactions;
			var _objectID;
			var _object;
			var _start;
			var _end;

			function applyFilter() {
				MeprProReportChart.update();
				MeprProReportSalesTable.update();
			}

			function filterData() {
				var offset = moment().utcOffset();
				var fromDate = _start.clone().startOf('day').utcOffset(-offset);
				var toDate = _end.clone().endOf('day').utcOffset(-offset);

				filtered = _transactions.filter(function(transaction) {
					var created_at = moment(transaction.created_at);
					if (created_at.isBetween(fromDate, toDate)) {
						return true;
					}
					return false;
				});

				return filtered;
			}

			function cb(start, end) {
				_start = start;
				_end = end;
				_visual.html(start.format('MM/DD/YYYY') + ' - ' + end.format('MM/DD/YYYY'));
				applyFilter();
			}
		 
			return {
				init : function (transactions, objectID) {
					_transactions = transactions;

					_objectID = objectID;
					_object = $('#' + _objectID);
					_visual = $('#' + _objectID + ' span');

					var startDate = moment().subtract(29, 'days');
					var endDate = moment();

					cb(startDate, endDate);

					_object.daterangepicker({
						startDate: startDate,
						endDate: endDate,
						ranges: {
							'TODAY': [moment(), moment()],
							'YESTERDAY': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
							'LAST 7 DAYS': [moment().subtract(6, 'days'), moment()],
							'THIS WEEK': [moment().startOf('week'), moment().endOf('week')],
							'LAST WEEK': [moment().subtract(1, 'weeks').startOf('week'), moment().subtract(1, 'weeks').endOf('week')],
							'LAST 30 DAYS': [moment().subtract(29, 'days'), moment()],
							'THIS MONTH': [moment().startOf('month'), moment().endOf('month')],
							'LAST MONTH': [moment().subtract(1, 'months').startOf('month'), moment().subtract(1, 'months').endOf('month')],
							'THIS YEAR': [moment().startOf('year'), moment().endOf('year')],
							'LAST 364 DAYS': [moment().subtract(363, 'days'), moment()],
							'LAST YEAR': [moment().subtract(1, 'years').startOf('year'), moment().subtract(1, 'years').endOf('year')]
						}
					}, cb);
				},
				getTransactions : function () {
					var transactions = filterData();
					return transactions;
				},
				getDate : function () {
					return {
						start : _start.clone(),
						end : _end.clone(),
					};
				}
			};
		}());

		var MeprProReportProductFilter = (function() {

			var _objectID;
			var _object;
			var _tglBtnWrap;
			var _allSelectObject;
			var _products = [];
			var _selected = [];
			var _is_all = true;

			function applyFilter() {
				MeprProReportChart.update();
				MeprProReportSalesTable.update();
			}

			function initActions() {
				_allSelectObject.on('click', function() {
					if (_is_all == false) {
						_is_all = true;
						_allSelectObject.addClass('selected');
						_products.forEach(function(product) {
							product._object.removeClass('selected');
							product.selected = false;
						});
						applyFilter();
					}
				});

				_products.forEach(function(product) {
					product._object.on('click', function() {
						_is_all = false;
						_allSelectObject.removeClass('selected');

						if (product.selected == true) {
							product._object.removeClass('selected');
							product.selected = false;
							applyFilter();
						} else {
							product._object.addClass('selected');
							product.selected = true;
							applyFilter();
						}
					});
				});
			}

			return {
				init : function (products, objectID) {

					colors = d3.scaleOrdinal(d3.schemeCategory20).domain(products.map(function(d) { return d.ID; }));
					products.forEach(function(p) { p.color = colors(p.ID); })
					_products = products;

					_objectID = objectID;
					_object = $('#' + _objectID);

					_tglBtnWrap = $('<div class="tglBtnWrap"></div>');
					_object.append(_tglBtnWrap);

					_allSelectObject = $('<span class="selected">All products</span>');
					_tglBtnWrap.append(_allSelectObject);

					_products.forEach(function(product) {
						var productObject = $('<span>'+ product.post_title +'</span>');
						_tglBtnWrap.append(productObject);

						product._object = productObject;
						product.selected = false;
					});

					initActions();

				},
				getProducts: function () {
					if (_is_all) {
						return _products;
					} else {
						return _products.filter(function(p) { return p.selected == true; })
					}
				}
			}
		}());

		var MeprProReportChart = (function () {

			var _graphData = [];

			var _containerID;
			var _unitContainerID;
			var _tooltipID;

			var _container;
			var _unitContainer;
			var _SVG;
			var _GROUP;
			var _width = 0;
			var _height = 0;
			var _margin = { top: 20, bottom: 100, left: 20, right: 20 };

			function getDailyData (products, transactions, start, dayCount) {
				var graphData = [];

				for (var i = 0; i <= dayCount; i++) {
					var category = {};
					var date = start.clone().add(i, 'days');

					if (dayCount > 7) {
						category['category'] = date.format('M/D');
					} else {
						category['category'] = date.format('M/D ddd');
					}

					products.forEach(function(product) {
						var sales = transactions.filter(function(transaction) {
							if (transaction.product_id == product.ID && moment(transaction.created_at).isSame(date, 'day')) {
								return true;
							}
							return false;
						});
						var total = d3.sum(sales, function(sale) {
							return sale.total;
						});
						category[product.ID] = total || 0;
					});

					graphData.push(category);
				}

				_graphData = graphData;
			}

			function getMonthlyData (products, transactions) {
				var monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

				var graphData = [];

				for (var i = 0; i < 12; i++) {
					var category = {};

					category['category'] = monthNames[i];

					products.forEach(function(product) {
						var sales = transactions.filter(function(transaction) {
							if (transaction.product_id == product.ID && moment(transaction.created_at).month() == i) {
								return true;
							}
							return false;
						})
						var total = d3.sum(sales, function(sale) {
							return sale.total;
						});
						category[product.ID] = total || 0;
					})

					graphData.push(category);
				}
				
				_graphData = graphData;
			}

			function getGraphData (products, transactions, start, end) {
				var dayCount = end.diff(start, 'days');
				if (dayCount > 31) {
					getMonthlyData(products, transactions);
				} else {
					getDailyData(products, transactions, start, dayCount);
				}
			}

			function draw (products) {
			    
			    // product key:value
				var productObject = {};
				products.forEach(function(p) {
					productObject[p.ID] = p;
				});
			    
			    // Data Keys Extract
				var categories = _graphData.map(function(d) { return d.category; });
				var productIDs = products.map(function(d) { return d.ID; });
				var totals = _graphData.map(function(category) {
					var total = 0;
					productIDs.forEach(function(product) {
						total += category[product];
					});
					return total;
				});
				
				// Total Prices
				var totalPrice = totals.reduce(function(price, sum) {
				    return price + sum
				})
				// console.log(totalPrice, totalPrice.toFixed(2), parseFloat(totalPrice.toFixed(2)), totalPrice.toFixed(2).toString())
				$('#item_price_total').html('$' + parseFloat(totalPrice.toFixed(2)))

				// Init Container Size
				var containerWidth  = _container.innerWidth();
				var containerHeight = 500;

				_width  = containerWidth  - _margin.left - _margin.right;
				_height = containerHeight - _margin.top  - _margin.bottom;

				_SVG.attr('width',  containerWidth);
				_SVG.attr('height', containerHeight);

				_GROUP.selectAll("*").remove();
				_GROUP.attr("transform", "translate(" + _margin.left + "," + _margin.top + ")");

				// Draw SVG
				var stack = d3.stack();

				var xScale = d3.scaleBand()
					.rangeRound([0, _width])
					.padding(0.3)
					.align(0.5)
					.domain(categories);

				var yScale = d3.scaleLinear()
					.rangeRound([_height, 0])
					.domain([0, d3.max(totals, function(total) { return total; })]).nice();

				var stack = d3.stack();

				_GROUP.selectAll(".product")
					.data(stack.keys(productIDs)(_graphData))
					.enter().append("g")
					.attr("class", "product")
					.selectAll("rect")
					.data(function(d) {
						d.forEach(function(e) {
							e.product_id = d.key;
							e.color = productObject[d.key].color;
						});
						return d;
					})
					.enter().append("rect")
					.attr("fill", function(d) { return d.color; })
					.attr("x", function(d) { return xScale(d.data.category); })
					.attr("y", function(d) { return yScale(d[1]); })
					.attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
					.attr("width", xScale.bandwidth())
					.on("mouseover", function(d) {
						var productName = products.filter(function(p) { return p.ID == d.product_id; })[0]['post_title'];
						var productSale = d.data[d.product_id];
						
						var xPosition = xScale(d.data.category);
						var yPosition = yScale(d[1]) - 50;
						var tooltip = d3.select("#" + _tooltipID)
							.style("left", xPosition + "px")
							.style("top", yPosition + "px");
						
						tooltip.select(".product_title").text(productName);
						tooltip.select(".product_sale").text(productSale);

						d3.select("#" + _tooltipID).classed("hidden", false);
					})
					.on("mouseout", function() {
						d3.select("#" + _tooltipID).classed("hidden", true);
					});

				_GROUP.append("g")
					.attr("class", "category-axis")
					.attr("transform", "translate(0," + _height + ")")
					.call(d3.axisBottom(xScale).tickSize(0).tickPadding(20))
					.call(g => g.select(".domain").remove());

				_GROUP.append("g")
					.attr("class", "category-total-axis")
					.attr("transform", "translate(0," + _height + ")")
					.call(d3.axisBottom(xScale).tickSize(0).tickPadding(60).tickFormat(function(d, i) {
						return '$' + totals[i]
					}))
					.call(g => g.select(".domain").remove());
			}
		 
			return {
				init : function (containerID, unitContainerID, tooltipID) {
					_containerID = containerID;
					_unitContainerID = unitContainerID;
					_tooltipID = tooltipID;

					_container = $('#' + _containerID);

					_SVG = d3.select("#" + _containerID).append("svg");
					_GROUP = _SVG.append("g");
				},
				update: function () {
					var products = MeprProReportProductFilter.getProducts();
					var transactions = MeprProReportDateFilter.getTransactions();
					var start = MeprProReportDateFilter.getDate().start;
					var end = MeprProReportDateFilter.getDate().end;
					getGraphData(products, transactions, start, end);
					draw(products);
				}
			}; // end of the return
		}());

		var MeprProReportSalesTable = (function () {
			var _containerID;
			var _tableBody;
			var _tableData;

			function getArraySum (data) {
				if (data.length > 0) {
					return data.reduce(function(total, t){ return total + t; })
				}
				return 0;
			}

			function getTableData (products, transactions) {
				var tableData = [];
				products.forEach(function(product) {
					var allTransaction = transactions.filter(function(transaction) {
						return transaction.product_id == product.ID;
					});
					var couponTransaction = transactions.filter(function(transaction) {
						return transaction.product_id == product.ID && transaction.coupon_id != '0';
					});

					tableData.push({
						productColor : product.color,
						productName : product.post_title,
						quantity : allTransaction.length,
						coupon : couponTransaction.length,
						total : getArraySum(allTransaction.map(function(d){ return parseFloat(d.total); }))
					});
				})

				_tableData = tableData;
			}

			function update () {
				var tableBodyHTML = '';
				_tableData.forEach(function(d) {
					tableBodyHTML += ' \
						<tr> \
							<td style="background-color: '+ d.productColor +'">&nbsp;</td> \
							<td>' + d.productName + '</td> \
							<td>' + d.quantity + '</td> \
							<td>' + d.coupon + '</td> \
							<td>$' + d.total.toFixed(2) + '</td> \
						</tr> \
					';
				})
				_tableBody.html(tableBodyHTML);
			}

			return {
				init : function (containerID) {
					_containerID = containerID;
					_tableBody = $('#' + _containerID + ' table tbody');
				},
				update: function () {
					var products = MeprProReportProductFilter.getProducts();
					var transactions = MeprProReportDateFilter.getTransactions();
					getTableData(products, transactions);
					update();
				}
			}
		}());
	});
	
})( jQuery );
