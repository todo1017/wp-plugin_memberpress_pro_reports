<?php


// enqueue styles
function mepr_pro_report_enqueue_styles( $hook ) {
	// check if our page
	if ( 'memberpress_page_mepr-pro-report' !== $hook ) return;

	$fontawesome_style = plugins_url( '/css/fontawesome/css/all.min.css', __FILE__ );
	$daterangepicker_style = plugins_url( '/css/daterangepicker.css', __FILE__ );
	$jquerydropdown_style = plugins_url( '/css/jquery.dropdown.css', __FILE__ );
	$mepr_pro_report_style = plugins_url( '/css/mepr-pro-report.css', __FILE__ );

	wp_enqueue_style('fontawesome_style', $fontawesome_style);
	wp_enqueue_style('daterangepicker_style', $daterangepicker_style);
	wp_enqueue_style('jquerydropdown_style', $jquerydropdown_style);
	wp_enqueue_style('mepr_pro_report_style', $mepr_pro_report_style);
}
add_action( 'admin_enqueue_scripts', 'mepr_pro_report_enqueue_styles' );



// enqueue scripts
function mepr_pro_report_enqueue_scripts( $hook ) {

	// check if our page
	if ( 'memberpress_page_mepr-pro-report' !== $hook ) return;

	// define script url
	$moment_url = plugins_url( '/js/moment.min.js', __FILE__ );
	$d3_v4_url = plugins_url( '/js/d3.v4.min.js', __FILE__ );
	$daterangepicker_url = plugins_url( '/js/daterangepicker.min.js', __FILE__ );
	$jquerydropdown_url = plugins_url( '/js/jquery.dropdown.js', __FILE__ );
	$mepr_pro_report_url = plugins_url( '/js/mepr-pro-report.js', __FILE__ );

	// enqueue script
	wp_enqueue_script('moment_dep', $moment_url);
	wp_enqueue_script('d3_v4_url_dep', $d3_v4_url);
	wp_enqueue_script('daterangepicker_dep', $daterangepicker_url, array('jquery', 'moment_dep'));
	wp_enqueue_script('jquerydropdown_dep', $jquerydropdown_url, array('jquery'));
	wp_enqueue_script('mepr_pro_report_dep', $mepr_pro_report_url, array( 'daterangepicker_dep', 'd3_v4_url_dep', 'jquerydropdown_dep'));

	// create nonce
	$nonce = wp_create_nonce( 'mepr_pro_report_nonce' );

	// define script
	$script = array( 'nonce' => $nonce );

	// localize script
	wp_localize_script('mepr_pro_report_dep', 'mepr_pro_report', $script);

}
add_action( 'admin_enqueue_scripts', 'mepr_pro_report_enqueue_scripts' );