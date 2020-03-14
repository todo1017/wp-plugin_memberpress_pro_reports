<?php // MyPlugin - Admin Menu


/**
 * exit if file is called directly
 */

if ( ! defined( 'ABSPATH' ) ) {

	exit;

}


/**
 * Add submenu on MemberPress
 */

function mepr_pro_report_add_submenu() {
	
	/**
	 * Check MemberPress plugin is active
	 */

	if ( is_plugin_active( 'memberpress/memberpress.php' ) ) {
	
		add_submenu_page(
			'memberpress',
			__('Pro Reports', 'memberpress'),
			__('Pro Reports', 'memberpress'),
			'manage_options',
			'mepr-pro-report',
			'mepr_pro_report_view'
		);

	}
	
}
add_action( 'mepr_menu', 'mepr_pro_report_add_submenu' );